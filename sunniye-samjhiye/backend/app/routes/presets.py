from fastapi import APIRouter
from typing import List, Dict, Any
from ..services.demo_service import get_demo_presets

router = APIRouter(prefix="/presets", tags=["Presets"])

@router.get("", response_model=List[Dict[str, Any]])
def list_presets():
    return get_demo_presets()

