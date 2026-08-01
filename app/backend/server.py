from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Chai Maska Bun Amruttulya Franchise API")
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

ADMIN_EMAIL = "chaimaskabunn@gmail.com"
ADMIN_PASS = "RishabhAndShrawan@20002001"

class PackageItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    included: bool = True

class FranchisePackage(BaseModel):
    id: str
    name: str
    price: int
    tagline: str
    description: str
    image: str
    badge: Optional[str] = None
    items: List[PackageItem] = []
    features: List[str] = []
    roi_months: str
    support_level: str

class PackageUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    badge: Optional[str] = None
    items: Optional[List[PackageItem]] = None
    features: Optional[List[str]] = None
    roi_months: Optional[str] = None
    support_level: Optional[str] = None

class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: int
    description: str
    image: str
    popular: bool = False

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[int] = None
    description: Optional[str] = None
    image: Optional[str] = None
    popular: Optional[bool] = None

class FranchiseApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    package_id: str
    package_name: str
    full_name: str
    email: Optional[str] = ""
    phone: str
    city: str
    state: str = "Madhya Pradesh"
    message: Optional[str] = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "Pending"

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

INITIAL_PACKAGES = [
    {
        "id": "silver",
        "name": "Silver Franchise",
        "price": 99000,
        "tagline": "The Ultimate Starter Kit for Tea Entrepreneurs",
        "description": "Ideal for kiosk setups, high-footfall street corners, and college campus outlets with low overhead and quick payback.",
        "image": "https://customer-assets-v7afamib.emergentagent.net/job_chai-membership/artifacts/bcjry3k0_image.png",
        "badge": "Popular Starter",
        "roi_months": "3 - 5 Months",
        "support_level": "Standard Training & Operations Manual",
        "features": [
            "Complete Chai & Maska Bun Equipment Kit",
            "Initial Raw Material Stock worth ₹15,000",
            "Brand Signage & Neon Logo Board",
            "Staff Training at Flagship Rewa Hub",
            "Marketing & Social Media Launch Kit"
        ],
        "items": [
            {"id": "s1", "name": "Heavy-Duty Brass Chai Boiler", "description": "Traditional authentic brew setup", "included": True},
            {"id": "s2", "name": "Commercial Bun Toasting Grill", "description": "For perfect golden maska buns", "included": True},
            {"id": "s3", "name": "Initial Raw Material Stock", "description": "Chai patti, spices, butter, buns", "included": True},
            {"id": "s4", "name": "Uniforms & Aprons (4 sets)", "description": "Branded cotton uniforms", "included": True},
            {"id": "s5", "name": "POS & Digital Billing Setup", "description": "Mobile friendly order tracker", "included": True}
        ]
    },
    {
        "id": "gold",
        "name": "Gold Franchise",
        "price": 129000,
        "tagline": "Full Cafe Setup with Expanded Menu & Seating",
        "description": "Perfect for high street markets and shopping complexes. Includes full interior styling, seating kits, and snacks machinery.",
        "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80",
        "badge": "Most Recommended",
        "roi_months": "4 - 6 Months",
        "support_level": "Priority On-Site Launch Assistance",
        "features": [
            "Everything in Silver Franchise + Seating Furniture Kit",
            "Advanced Snacks & Bun Varieties Machinery",
            "Initial Raw Material Stock worth ₹35,000",
            "Interior Wall Graphics & Neon Ambiance Branding",
            "Dedicated Regional Manager & Local Marketing Ads"
        ],
        "items": [
            {"id": "g1", "name": "Dual-Burner Brass Chai Station", "description": "High output tea brewing station", "included": True},
            {"id": "g2", "name": "Premium Maska Bun & Grill Unit", "description": "High capacity commercial toaster", "included": True},
            {"id": "g3", "name": "Cafe Seating Set (4 Tables, 16 Stools)", "description": "Custom branded wooden finish furniture", "included": True},
            {"id": "g4", "name": "Initial Raw Material & Spice Kit", "description": "Worth ₹35,000 stock supply", "included": True},
            {"id": "g5", "name": "Illuminated 3D Neon Acrylic Signage", "description": "Eye-catching glowing facade board", "included": True},
            {"id": "g6", "name": "POS Terminal & Receipt Printer", "description": "Complete hardware & software suite", "included": True}
        ]
    },
    {
        "id": "platinum",
        "name": "Platinum Franchise",
        "price": 249000,
        "tagline": "Flagship Master Cafe Experience with Full Customization",
        "description": "Our premier turnkey franchise model for prime city locations. Fully designed flagship cafe with complete VIP launch campaign.",
        "image": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80",
        "badge": "Flagship Elite",
        "roi_months": "5 - 8 Months",
        "support_level": "24/7 VIP Support & Celebrity Grand Opening",
        "features": [
            "Turnkey Flagship Interior Design & 3D Execution",
            "Complete High-Capacity Commercial Kitchen Suite",
            "Initial Raw Material Stock worth ₹75,000",
            "Celebrity / Influencer Grand Opening Campaign",
            "Exclusive Territorial Rights (City/District Level)"
        ],
        "items": [
            {"id": "p1", "name": "Triple-Station Master Brass Boiler", "description": "Unmatched volume tea brewing", "included": True},
            {"id": "p2", "name": "Full Industrial Kitchen Suite", "description": "Grills, refrigerators, prep counters", "included": True},
            {"id": "p3", "name": "Luxury Premium Cafe Furniture Set", "description": "Sofa booths, designer tables, bar stools", "included": True},
            {"id": "p4", "name": "Elite Raw Material & Merch Kit", "description": "Worth ₹75,000 initial stock", "included": True},
            {"id": "p5", "name": "Complete Exterior LED & Neon Facade", "description": "Maximum night visibility package", "included": True},
            {"id": "p6", "name": "Dedicated Chef & Staff Training On-Site", "description": "1 week expert deployment at your outlet", "included": True}
        ]
    }
]

INITIAL_MENU = [
    {
        "id": "m1",
        "name": "Amruttulya Special Kulhad Chai",
        "category": "Chai",
        "price": 20,
        "description": "Slow-brewed traditional tea served in earthy terracotta kulhad with secret aromatic spices.",
        "image": "https://customer-assets-v7afamib.emergentagent.net/job_chai-membership/artifacts/bcjry3k0_image.png",
        "popular": True
    },
    {
        "id": "m2",
        "name": "Classic Maska Bun",
        "category": "Maska Bun",
        "price": 35,
        "description": "Soft fluffy butter bun slathered with pure Amul butter and a touch of secret sweetness.",
        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "popular": True
    },
    {
        "id": "m3",
        "name": "Elachi & Ginger Special Chai",
        "category": "Chai",
        "price": 25,
        "description": "Infused with fresh crushed green cardamom and farm-fresh ginger root.",
        "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
        "popular": False
    },
    {
        "id": "m4",
        "name": "Jam & Cheese Maska Bun",
        "category": "Maska Bun",
        "price": 50,
        "description": "Toasted bun loaded with rich mixed fruit jam and melted cheese slice.",
        "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
        "popular": True
    },
    {
        "id": "m5",
        "name": "Crispy Samosa & Chai Combo",
        "category": "Snacks",
        "price": 45,
        "description": "Golden crispy potato samosa served with spicy green chutney and hot kulhad chai.",
        "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
        "popular": True
    },
    {
        "id": "m6",
        "name": "Bun Maska Jam Special",
        "category": "Maska Bun",
        "price": 40,
        "description": "Traditional Bombay style buttery bun with thick fruit jam layer.",
        "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
        "popular": False
    },
    {
        "id": "m7",
        "name": "Cold Coffee with Ice Cream",
        "category": "Beverages",
        "price": 80,
        "description": "Thick blended cold coffee topped with vanilla ice cream and chocolate drizzle.",
        "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
        "popular": False
    },
    {
        "id": "m8",
        "name": "Maggi Masala Special",
        "category": "Snacks",
        "price": 50,
        "description": "Hot soupy desi masala maggi loaded with veggies and butter.",
        "image": "https://images.unsplash.com/photo-1612927601601-6638404738c2?auto=format&fit=crop&w=800&q=80",
        "popular": True
    }
]

@app.on_event("startup")
async def seed_database():
    pkg_count = await db.packages.count_documents({})
    if pkg_count == 0:
        for pkg in INITIAL_PACKAGES:
            await db.packages.update_one({"id": pkg["id"]}, {"$set": pkg}, upsert=True)
            
    menu_count = await db.menu.count_documents({})
    if menu_count == 0:
        for item in INITIAL_MENU:
            await db.menu.update_one({"id": item["id"]}, {"$set": item}, upsert=True)
    logger.info("Database initialized with packages & menu items.")

@api_router.get("/")
async def root():
    return {"message": "Chai Maska Bun Amruttulya API is live", "founders": "Shrawan Gupta & Rishabh Gupta"}

@api_router.get("/packages", response_model=List[FranchisePackage])
async def get_packages():
    packages = await db.packages.find({}, {"_id": 0}).to_list(100)
    if not packages:
        return INITIAL_PACKAGES
    return packages

@api_router.get("/packages/{package_id}", response_model=FranchisePackage)
async def get_package(package_id: str):
    pkg = await db.packages.find_one({"id": package_id}, {"_id": 0})
    if not pkg:
        for p in INITIAL_PACKAGES:
            if p["id"] == package_id:
                return p
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu.find({}, {"_id": 0}).to_list(200)
    if not items:
        return INITIAL_MENU
    return items

@api_router.post("/admin/login")
async def admin_login_endpoint(data: dict):
    email = data.get("email")
    password = data.get("password")
    if email == ADMIN_EMAIL and password == ADMIN_PASS:
        return {"success": True, "token": "admin-mock-jwt-token-chai-2026", "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid admin email or password")

@api_router.put("/admin/packages/{package_id}", response_model=FranchisePackage)
async def update_package(package_id: str, update_data: PackageUpdate):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    result = await db.packages.find_one_and_update(
        {"id": package_id},
        {"$set": update_dict},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Package not found")
    return result

@api_router.post("/admin/packages", response_model=FranchisePackage)
async def create_package(pkg: FranchisePackage):
    existing = await db.packages.find_one({"id": pkg.id})
    if existing:
        raise HTTPException(status_code=400, detail="Package ID already exists")
    await db.packages.insert_one(pkg.model_dump())
    return pkg

@api_router.delete("/admin/packages/{package_id}")
async def delete_package(package_id: str):
    res = await db.packages.delete_one({"id": package_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True, "message": "Package deleted successfully"}

# Menu Admin Endpoints
@api_router.post("/admin/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItem):
    doc = item.model_dump()
    await db.menu.insert_one(doc)
    return item

@api_router.put("/admin/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, update_data: MenuItemUpdate):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    result = await db.menu.find_one_and_update(
        {"id": item_id},
        {"$set": update_dict},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return result

@api_router.delete("/admin/menu/{item_id}")
async def delete_menu_item(item_id: str):
    res = await db.menu.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"success": True, "message": "Menu item deleted successfully"}

# OTP System for Franchise Application
@api_router.post("/auth/send-otp")
async def send_otp(payload: SendOTPRequest):
    phone = payload.phone
    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    generated_otp = str(random.randint(1000, 9999))
    # Store OTP in DB with timestamp
    await db.otps.update_one(
        {"phone": phone},
        {"$set": {"otp": generated_otp, "created_at": datetime.now(timezone.utc).isoformat(), "verified": False}},
        upsert=True
    )
    logger.info(f"Generated OTP {generated_otp} for phone {phone}")
    return {"success": True, "message": f"OTP sent successfully to {phone}", "demo_otp": generated_otp}

@api_router.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOTPRequest):
    record = await db.otps.find_one({"phone": payload.phone})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP requested for this phone number")
    
    if record["otp"] == payload.otp:
        await db.otps.update_one({"phone": payload.phone}, {"$set": {"verified": True}})
        return {"success": True, "message": "Phone number verified successfully!"}
    
    raise HTTPException(status_code=400, detail="Invalid OTP entered")

@api_router.post("/applications", response_model=FranchiseApplication)
async def apply_franchise(app_data: FranchiseApplication):
    # Optional check if phone is verified
    otp_record = await db.otps.find_one({"phone": app_data.phone})
    if not otp_record or not otp_record.get("verified", False):
        raise HTTPException(status_code=400, detail="Phone number must be verified via OTP before submitting application.")

    doc = app_data.model_dump()
    await db.applications.insert_one(doc)
    return app_data

@api_router.get("/admin/applications", response_model=List[FranchiseApplication])
async def get_applications():
    apps = await db.applications.find({}, {"_id": 0}).to_list(500)
    return apps

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
