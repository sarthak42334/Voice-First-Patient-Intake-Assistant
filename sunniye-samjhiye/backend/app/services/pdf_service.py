import io
import datetime
from typing import Optional, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from ..models import Intake
from ..config import settings

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        footer_text = (
            f"Sunniye, Samjhiye Patient Intake Record • Page {self._pageNumber} of {page_count} • "
            "CONFIDENTIAL MEDICAL INTAKE"
        )
        self.drawRightString(612 - 40, 25, footer_text)
        disclaimer = "Documentation only: Non-diagnostic, non-triage record. Must be reviewed by licensed clinician."
        self.drawString(40, 25, disclaimer)
        self.restoreState()

def generate_intake_pdf(intake: Intake) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#991b1b")
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#334155")
    )

    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b")
    )

    cell_quote_style = ParagraphStyle(
        'TableCellQuote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#475569")
    )

    story = []

    # App Header
    story.append(Paragraph("SUNNIYE, SAMJHIYE (सुनिए, समझिए)", title_style))
    story.append(Paragraph("Voice-First Patient-Reported Intake Record & Documentation", subtitle_style))

    # Prominent Disclaimer Banner
    banner_data = [[
        Paragraph(
            f"<b>CRITICAL NOTICE:</b> {settings.PERSISTENT_DISCLAIMER}<br/>"
            "This document is an intake record of patient-reported statements. It contains NO medical diagnosis, "
            "triage decision, or treatment plan, and must be reviewed by a licensed clinician.",
            disclaimer_style
        )
    ]]
    banner_table = Table(banner_data, colWidths=[532])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#f87171")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 12))

    # Intake Metadata Block
    created_str = intake.created_at.strftime("%Y-%m-%d %H:%M UTC") if intake.created_at else "N/A"
    approved_str = (
        f"Approved by {intake.approved_by_worker or 'Healthcare Worker'} at {intake.approved_at.strftime('%Y-%m-%d %H:%M UTC')}"
        if intake.approved_at else "Pending Final Clinician Approval"
    )

    meta_data = [
        [
            Paragraph("<b>Patient Display ID:</b>", cell_style),
            Paragraph(f"<font size=11 color='#0284c7'><b>{intake.patient_display_id}</b></font>", cell_style),
            Paragraph("<b>Intake Date:</b>", cell_style),
            Paragraph(created_str, cell_style)
        ],
        [
            Paragraph("<b>Review Status:</b>", cell_style),
            Paragraph(f"<b>{intake.status.upper()}</b>", cell_style),
            Paragraph("<b>Sign-off Status:</b>", cell_style),
            Paragraph(approved_str, cell_style)
        ],
        [
            Paragraph("<b>Source Provider:</b>", cell_style),
            Paragraph(intake.provider or "Sarvam AI", cell_style),
            Paragraph("<b>Audio Storage:</b>", cell_style),
            Paragraph("Retained" if intake.audio_stored else "Ephemeral / Not Stored (Privacy Preserved)", cell_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[110, 156, 110, 156])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Approved / Draft Summary Section
    story.append(Paragraph("1. Approved Patient Intake Summary", section_heading))
    summary_text = intake.summary_approved or intake.summary_draft or "Summary not yet approved."
    # Replace plain linebreaks with paragraph breaks
    for para in summary_text.split("\n\n"):
        para_clean = para.replace("\n", "<br/>")
        story.append(Paragraph(para_clean, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))

    # Structured Extracted Facts Table
    story.append(Paragraph("2. Verified Extracted Facts (Direct Patient Quotes)", section_heading))
    
    facts_list = intake.get_facts_list()
    table_rows = [
        [
            Paragraph("<b>Category</b>", cell_style),
            Paragraph("<b>Reported Detail / Value</b>", cell_style),
            Paragraph("<b>Transcript Quote</b>", cell_style),
            Paragraph("<b>Status</b>", cell_style)
        ]
    ]

    for f in facts_list:
        cat_title = f.get("label") or f.get("category", "")
        val = f.get("value", "")
        quote = f.get("quote", "")
        status = f.get("status", "needs_review")
        
        status_color = "#15803d" if status == "confirmed" else ("#b45309" if status in ("needs_review", "unclear") else "#64748b")
        status_formatted = f"<font color='{status_color}'><b>{status.replace('_', ' ').upper()}</b></font>"

        table_rows.append([
            Paragraph(f"<b>{cat_title}</b>", cell_style),
            Paragraph(val, cell_style),
            Paragraph(f'"{quote}"' if quote else "<i>None quoted</i>", cell_quote_style),
            Paragraph(status_formatted, cell_style)
        ])

    if len(table_rows) > 1:
        facts_table = Table(table_rows, colWidths=[110, 180, 162, 80])
        facts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        story.append(facts_table)
    else:
        story.append(Paragraph("<i>No structured facts extracted yet.</i>", body_style))

    story.append(Spacer(1, 10))

    # Transcript Review Record
    story.append(Paragraph("3. Full Transcript Record", section_heading))
    trans_text = intake.reviewed_transcript or intake.raw_transcript or "No transcript recorded."
    story.append(Paragraph(trans_text.replace("\n", "<br/>"), body_style))

    if intake.worker_notes:
        story.append(Spacer(1, 10))
        story.append(Paragraph("4. Healthcare Worker Intake Notes", section_heading))
        story.append(Paragraph(intake.worker_notes.replace("\n", "<br/>"), body_style))

    # Build document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    return buffer.getvalue()

