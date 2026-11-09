from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, init_db
import models
from auth import hash_password
from import_excel_data import import_all_excel_data

def seed_database():
    init_db()
    db = SessionLocal()

    try:
        # Check if Excel data is imported
        try:
            import_all_excel_data(db=db, force=False)
        except Exception as e:
            print(f"[Seed] Note on Excel import: {e}")

        # 1. Seed or Sync Users with 4 Panels
        panels_users_data = [
            {
                "name": "Super Admin",
                "email": "superadmin@techno-communications.com",
                "phone": "(602) 555-0999",
                "password": "SuperAdmin@2026",
                "role": "SuperAdmin",
                "panel_type": "SuperAdmin",
                "department": "Admin",
                "departments": ["All", "Admin", "Maintenance", "Ordering", "Accounting", "IT", "HR", "Compliance"],
                "team_type": "Internal",
            },
            {
                "name": "Haseeb Siddiqui",
                "email": "manager@techno-communications.com",
                "phone": "(602) 555-0888",
                "password": "password123",
                "role": "Manager",
                "panel_type": "Manager",
                "department": "Management",
                "departments": ["Management"],
                "team_type": "Internal",
            },
            {
                "name": "Amad Hussain",
                "email": "amad@techno-communications.com",
                "phone": "(602) 555-0111",
                "password": "password123",
                "role": "Processor",
                "panel_type": "Processor",
                "department": "Admin",
                "departments": ["Admin", "Maintenance"],
                "team_type": "Internal",
            },
            {
                "name": "Nur Rahman",
                "email": "nur@techno-communications.com",
                "phone": "(602) 555-0199",
                "password": "password123",
                "role": "Placer",
                "panel_type": "Placer",
                "department": "Management",
                "departments": ["Management"],
                "team_type": "Internal",
            },
            {
                "name": "Jocel",
                "email": "jocel@techno-communications.com",
                "phone": "(602) 555-0182",
                "password": "password123",
                "role": "DM",
                "panel_type": "Manager",
                "department": "Management",
                "departments": ["Management"],
                "team_type": "Internal",
            },
            {
                "name": "Salman Riaz",
                "email": "salman@techno-communications.com",
                "phone": "(713) 555-0144",
                "password": "password123",
                "role": "DM",
                "panel_type": "Manager",
                "department": "Management",
                "departments": ["Management"],
                "team_type": "Internal",
            },
            {
                "name": "Syed Faizan",
                "email": "faizan@techno-communications.com",
                "phone": "(901) 555-0133",
                "password": "password123",
                "role": "Compliance",
                "panel_type": "Processor",
                "department": "Compliance",
                "departments": ["Compliance"],
                "team_type": "Internal",
            },
            {
                "name": "Maqadam Mustfa",
                "email": "maqadam@techno-communications.com",
                "phone": "(602) 555-0122",
                "password": "password123",
                "role": "Solver",
                "panel_type": "Processor",
                "department": "Maintenance",
                "departments": ["Maintenance"],
                "team_type": "Internal",
            },
            {
                "name": "Mukkaram Shareef",
                "email": "mukkaram@techno-communications.com",
                "phone": "(713) 555-0155",
                "password": "password123",
                "role": "Solver",
                "panel_type": "Processor",
                "department": "IT",
                "departments": ["IT"],
                "team_type": "Internal",
            },
            {
                "name": "Saunders Contractor Services",
                "email": "saunders@external-tech.com",
                "phone": "(800) 555-0177",
                "password": "password123",
                "role": "Solver",
                "panel_type": "Processor",
                "department": "Maintenance",
                "departments": ["Maintenance"],
                "team_type": "External",
            },
            {
                "name": "Fatima Accounting Lead",
                "email": "accounting@techno-communications.com",
                "phone": "(602) 555-0166",
                "password": "password123",
                "role": "Admin",
                "panel_type": "Processor",
                "department": "Accounting",
                "departments": ["Accounting"],
                "team_type": "Internal",
            },
        ]

        created_users = {}
        for u in panels_users_data:
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            if existing:
                existing.name = u["name"]
                existing.phone = u["phone"]
                existing.role = u["role"]
                existing.panel_type = u["panel_type"]
                existing.department = u["department"]
                existing.departments = u["departments"]
                existing.team_type = u["team_type"]
                existing.password_hash = hash_password(u["password"])
                created_users[u["email"]] = existing
            else:
                user = models.User(
                    name=u["name"],
                    email=u["email"],
                    phone=u["phone"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    panel_type=u["panel_type"],
                    department=u["department"],
                    departments=u["departments"],
                    team_type=u["team_type"],
                    created_at=datetime.utcnow() - timedelta(days=90),
                )
                db.add(user)
                db.flush()
                created_users[u["email"]] = user
        db.commit()

        # Check if tickets already exist
        if db.query(models.Ticket).count() > 0:
            print("[Seed] Users synced and tickets already present.")
            return

        print("[Seed] Seeding Techno Communications LLC mock tickets...")

        # 2. Seed Stores
        stores_data = [
            {
                "tech_id": "Tech3458",
                "market": "Arizona",
                "door_code": "70851709",
                "store_name": "6544 W Thomas Rd",
                "store_email": "tech3458@techno-communications.com",
                "store_phone": "(623) 846-1200",
                "store_address": "6544 W Thomas Rd, Phoenix, AZ 85033",
            },
            {
                "tech_id": "Tech1006",
                "market": "Arizona",
                "door_code": "89123401",
                "store_name": "3502 W Camelback Rd",
                "store_email": "tech1006@techno-communications.com",
                "store_phone": "(602) 246-8800",
                "store_address": "3502 W Camelback Rd, Phoenix, AZ 85019",
            },
            {
                "tech_id": "Tech5521",
                "market": "Houston",
                "door_code": "44512988",
                "store_name": "9820 Gulf Fwy",
                "store_email": "tech5521@techno-communications.com",
                "store_phone": "(713) 941-2200",
                "store_address": "9820 Gulf Fwy, Houston, TX 77034",
            },
            {
                "tech_id": "Tech5542",
                "market": "Houston",
                "door_code": "33219087",
                "store_name": "10901 Airline Dr",
                "store_email": "tech5542@techno-communications.com",
                "store_phone": "(281) 448-3300",
                "store_address": "10901 Airline Dr, Houston, TX 77037",
            },
            {
                "tech_id": "Tech8810",
                "market": "Bay Area",
                "door_code": "12903847",
                "store_name": "2430 Mission St",
                "store_email": "tech8810@techno-communications.com",
                "store_phone": "(415) 641-7700",
                "store_address": "2430 Mission St, San Francisco, CA 94110",
            },
            {
                "tech_id": "Tech8825",
                "market": "Bay Area",
                "door_code": "99823145",
                "store_name": "1510 International Blvd",
                "store_email": "tech8825@techno-communications.com",
                "store_phone": "(510) 534-1100",
                "store_address": "1510 International Blvd, Oakland, CA 94606",
            },
            {
                "tech_id": "Tech4102",
                "market": "Utah",
                "door_code": "55123984",
                "store_name": "3550 S Redwood Rd",
                "store_email": "tech4102@techno-communications.com",
                "store_phone": "(801) 972-5500",
                "store_address": "3550 S Redwood Rd, West Valley City, UT 84119",
            },
            {
                "tech_id": "Tech6201",
                "market": "Philly",
                "door_code": "77821903",
                "store_name": "5200 Chestnut St",
                "store_email": "tech6201@techno-communications.com",
                "store_phone": "(215) 748-4400",
                "store_address": "5200 Chestnut St, Philadelphia, PA 19139",
            },
            {
                "tech_id": "Tech6218",
                "market": "Philly",
                "door_code": "88231094",
                "store_name": "2600 N Broad St",
                "store_email": "tech6218@techno-communications.com",
                "store_phone": "(215) 227-9900",
                "store_address": "2600 N Broad St, Philadelphia, PA 19132",
            },
            {
                "tech_id": "Tech2305",
                "market": "Memphis",
                "door_code": "66129034",
                "store_name": "4150 Elvis Presley Blvd",
                "store_email": "tech2305@techno-communications.com",
                "store_phone": "(901) 396-8800",
                "store_address": "4150 Elvis Presley Blvd, Memphis, TN 38116",
            },
            {
                "tech_id": "Tech7101",
                "market": "Miami",
                "door_code": "90341289",
                "store_name": "1490 NW 36th St",
                "store_email": "tech7101@techno-communications.com",
                "store_phone": "(305) 635-1200",
                "store_address": "1490 NW 36th St, Miami, FL 33142",
            },
            {
                "tech_id": "Tech9102",
                "market": "El Paso",
                "door_code": "44129870",
                "store_name": "7930 Alameda Ave",
                "store_email": "tech9102@techno-communications.com",
                "store_phone": "(915) 859-6600",
                "store_address": "7930 Alameda Ave, El Paso, TX 79915",
            },
            {
                "tech_id": "Tech3301",
                "market": "Arkansas",
                "door_code": "55091238",
                "store_name": "6100 W 65th St",
                "store_email": "tech3301@techno-communications.com",
                "store_phone": "(501) 568-3300",
                "store_address": "6100 W 65th St, Little Rock, AR 72209",
            },
        ]

        created_stores = []
        for s in stores_data:
            st = models.Store(**s, created_at=datetime.utcnow() - timedelta(days=90))
            db.add(st)
            db.flush()
            created_stores.append(st)

        # 3. Seed Corporate Houses
        houses_data = [
            {
                "market": "Memphis",
                "house_name": "Cordova Corporate House",
                "address": "9469 Darren Cir S, Cordova, TN 38018",
                "manager_name": "Jocel",
                "contact_phone": "(901) 555-0182",
            },
            {
                "market": "Arizona",
                "house_name": "Phoenix Executive Residence",
                "address": "4410 E Camelback Rd, Phoenix, AZ 85018",
                "manager_name": "Nur Rahman",
                "contact_phone": "(602) 555-0199",
            },
            {
                "market": "Houston",
                "house_name": "Houston Team House",
                "address": "1220 Westheimer Rd, Houston, TX 77006",
                "manager_name": "Salman Riaz",
                "contact_phone": "(713) 555-0144",
            },
            {
                "market": "Bay Area",
                "house_name": "Bay Area Corporate Residence",
                "address": "780 Bush St, San Francisco, CA 94108",
                "manager_name": "Jocel",
                "contact_phone": "(415) 555-0167",
            },
        ]

        created_houses = []
        for h in houses_data:
            hs = models.House(**h, created_at=datetime.utcnow() - timedelta(days=90))
            db.add(hs)
            db.flush()
            created_houses.append(hs)

        # 4. Seed MM/DM Directory
        mm_dm_data = [
            {
                "market": "Arizona",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Jocel",
                "dm_email": "jocel@techno-communications.com",
                "dm_phone": "(602) 555-0182",
            },
            {
                "market": "Houston",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Salman Riaz",
                "dm_email": "salman@techno-communications.com",
                "dm_phone": "(713) 555-0144",
            },
            {
                "market": "Bay Area",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Jocel",
                "dm_email": "jocel@techno-communications.com",
                "dm_phone": "(415) 555-0167",
            },
            {
                "market": "Memphis",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Salman Riaz",
                "dm_email": "salman@techno-communications.com",
                "dm_phone": "(901) 555-0144",
            },
            {
                "market": "Philly",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Jocel",
                "dm_email": "jocel@techno-communications.com",
                "dm_phone": "(215) 555-0182",
            },
            {
                "market": "Utah",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Salman Riaz",
                "dm_email": "salman@techno-communications.com",
                "dm_phone": "(801) 555-0144",
            },
            {
                "market": "Miami",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Jocel",
                "dm_email": "jocel@techno-communications.com",
                "dm_phone": "(305) 555-0182",
            },
            {
                "market": "El Paso",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Salman Riaz",
                "dm_email": "salman@techno-communications.com",
                "dm_phone": "(915) 555-0144",
            },
            {
                "market": "Arkansas",
                "mm_name": "Nur Rahman",
                "mm_email": "nur@techno-communications.com",
                "mm_phone": "(602) 555-0199",
                "dm_name": "Jocel",
                "dm_email": "jocel@techno-communications.com",
                "dm_phone": "(501) 555-0182",
            },
        ]

        for m in mm_dm_data:
            rec = models.MMDMInfo(**m, created_at=datetime.utcnow() - timedelta(days=90))
            db.add(rec)

        # 5. Seed Diverse Tickets (18+ tickets with varying age buckets, statuses, priorities, and payment details)
        now = datetime.utcnow()
        amad = created_users["amad@techno-communications.com"]
        maqadam = created_users["maqadam@techno-communications.com"]
        mukkaram = created_users["mukkaram@techno-communications.com"]
        saunders = created_users["saunders@external-tech.com"]
        faizan = created_users["faizan@techno-communications.com"]

        tickets_specs = [
            # 0–7 Days Old
            {
                "creator": amad,
                "days_ago": 2,
                "market": "Arizona",
                "location_type": "Store",
                "store": created_stores[0],
                "house": None,
                "category": "Electricity",
                "department": "Maintenance",
                "priority": "High",
                "status": "Assigned",
                "description": "Main retail floor lights are flickering and circuit breaker panel #2 trips every 45 minutes.",
                "assigned_to": maqadam,
                "solved_by_team": "Internal",
                "solved_by_name": "Maqadam Mustfa",
                "images": ["/uploads/sample_electric_1.jpg"],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": amad,
                "days_ago": 4,
                "market": "Houston",
                "location_type": "Store",
                "store": created_stores[2],
                "house": None,
                "category": "Ordering",
                "department": "Ordering",
                "priority": "Medium",
                "status": "Open",
                "description": "Restock needed for Metro marketing collateral, bag rolls, and SIM card replacement packs.",
                "assigned_to": None,
                "solved_by_team": None,
                "solved_by_name": None,
                "images": [],
                "attachments": [{"name": "order_manifest.xlsx", "url": "/uploads/order_manifest.xlsx"}],
                "payment_required": False,
            },
            {
                "creator": faizan,
                "days_ago": 3,
                "market": "Memphis",
                "location_type": "House",
                "store": None,
                "house": created_houses[0],
                "category": "Water",
                "department": "Maintenance",
                "priority": "High",
                "status": "Pending",
                "description": "Cordova House master bath faucet leaking into lower floor ceiling drywall.",
                "assigned_to": None,
                "solved_by_team": None,
                "solved_by_name": None,
                "images": ["/uploads/water_leak_1.jpg"],
                "attachments": [],
                "payment_required": False,
            },

            # 8–15 Days Old
            {
                "creator": amad,
                "days_ago": 10,
                "market": "Bay Area",
                "location_type": "Store",
                "store": created_stores[4],
                "house": None,
                "category": "IT",
                "department": "IT",
                "priority": "High",
                "status": "Assigned",
                "description": "Primary POS terminal 1 fails to handshake with T-Mobile backend via Ethernet gateway.",
                "assigned_to": mukkaram,
                "solved_by_team": "Internal",
                "solved_by_name": "Mukkaram Shareef",
                "images": [],
                "attachments": [{"name": "network_diagnostics.pdf", "url": "/uploads/network_diag.pdf"}],
                "payment_required": False,
            },
            {
                "creator": faizan,
                "days_ago": 12,
                "market": "Philly",
                "location_type": "Store",
                "store": created_stores[7],
                "house": None,
                "category": "Alarm",
                "department": "Admin",
                "priority": "Medium",
                "status": "Completed",
                "description": "Front door chime sensor malfunctioning, periodic false alarm signals dispatched to central station.",
                "assigned_to": maqadam,
                "solved_by_team": "Internal",
                "solved_by_name": "Maqadam Mustfa",
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": amad,
                "days_ago": 14,
                "market": "Arizona",
                "location_type": "House",
                "store": None,
                "house": created_houses[1],
                "category": "Dumpster",
                "department": "Maintenance",
                "priority": "Low",
                "status": "Hold",
                "description": "Bulk waste pickup scheduled with city municipality pending HOA authorization letter.",
                "assigned_to": maqadam,
                "solved_by_team": "Internal",
                "solved_by_name": "Maqadam Mustfa",
                "images": [],
                "attachments": [],
                "payment_required": False,
            },

            # 16–30 Days Old
            {
                "creator": amad,
                "days_ago": 22,
                "market": "Arizona",
                "location_type": "Store",
                "store": created_stores[1],
                "house": None,
                "category": "Maintenance",
                "department": "Maintenance",
                "priority": "High",
                "status": "Close",
                "description": "HVAC compressor fan seized during peak 105F afternoon. Immediate commercial repair required.",
                "assigned_to": saunders,
                "solved_by_team": "External",
                "solved_by_name": "Saunders Contractor Services",
                "images": ["/uploads/hvac_repair.jpg"],
                "attachments": [{"name": "invoice_4821.pdf", "url": "/uploads/invoice_4821.pdf"}],
                "payment_required": True,
                "payment_method": "Corporate Visa",
                "card_last_four": "4821",
                "payment_amount": 475.50,
                "invoice_url": "/uploads/invoice_4821.pdf",
                "closing_notes": "Replaced run capacitor and lubricated primary blower motor bearings. Thermostat re-calibrated.",
                "closing_checklist_verified": True,
                "closed_days_ago": 2,
            },
            {
                "creator": faizan,
                "days_ago": 20,
                "market": "Houston",
                "location_type": "Store",
                "store": created_stores[3],
                "house": None,
                "category": "Accounting",
                "department": "Accounting",
                "priority": "Medium",
                "status": "Re-Open",
                "description": "Daily Loomis deposit discrepancy on register #2 drawer report dated 15th.",
                "assigned_to": amad,
                "solved_by_team": "Internal",
                "solved_by_name": "Amad Hussain",
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": amad,
                "days_ago": 25,
                "market": "Utah",
                "location_type": "Store",
                "store": created_stores[6],
                "house": None,
                "category": "Codes",
                "department": "Admin",
                "priority": "Low",
                "status": "Close",
                "description": "Reprogram employee backdoor entry PIN codes following seasonal staffing transition.",
                "assigned_to": maqadam,
                "solved_by_team": "Internal",
                "solved_by_name": "Maqadam Mustfa",
                "images": [],
                "attachments": [],
                "payment_required": False,
                "closing_notes": "All front and backdoor digital locks updated with refreshed door codes.",
                "closing_checklist_verified": True,
                "closed_days_ago": 18,
            },
            {
                "creator": amad,
                "days_ago": 27,
                "market": "Miami",
                "location_type": "Store",
                "store": created_stores[10],
                "house": None,
                "category": "Supplies",
                "department": "Ordering",
                "priority": "Medium",
                "status": "Open",
                "description": "Quarterly sanitation supplies and branded uniform polos (Sizes M, L, XL) restock request.",
                "assigned_to": None,
                "solved_by_team": None,
                "solved_by_name": None,
                "images": [],
                "attachments": [],
                "payment_required": False,
            },

            # 30+ Days Old
            {
                "creator": amad,
                "days_ago": 45,
                "market": "Philly",
                "location_type": "Store",
                "store": created_stores[8],
                "house": None,
                "category": "Electricity",
                "department": "Maintenance",
                "priority": "High",
                "status": "Close",
                "description": "Neon exterior channel letter signage 'METRO BY T-MOBILE' power transformer burnt out.",
                "assigned_to": saunders,
                "solved_by_team": "External",
                "solved_by_name": "Saunders Contractor Services",
                "images": ["/uploads/neon_sign.jpg"],
                "attachments": [{"name": "sign_invoice_9012.pdf", "url": "/uploads/sign_invoice_9012.pdf"}],
                "payment_required": True,
                "payment_method": "Corporate Amex",
                "card_last_four": "9012",
                "payment_amount": 620.00,
                "invoice_url": "/uploads/sign_invoice_9012.pdf",
                "closing_notes": "Fitted new 60W IP67 LED transformers and replaced weathered wiring conduit.",
                "closing_checklist_verified": True,
                "closed_days_ago": 12,
            },
            {
                "creator": faizan,
                "days_ago": 52,
                "market": "Arkansas",
                "location_type": "Store",
                "store": created_stores[12],
                "house": None,
                "category": "Phones",
                "department": "IT",
                "priority": "Medium",
                "status": "Close",
                "description": "VoIP desk phones in customer service counter experiencing one-way audio latency.",
                "assigned_to": mukkaram,
                "solved_by_team": "Internal",
                "solved_by_name": "Mukkaram Shareef",
                "images": [],
                "attachments": [],
                "payment_required": False,
                "closing_notes": "Updated firmware on Yealink IP desk phones and configured QoS priority on router.",
                "closing_checklist_verified": True,
                "closed_days_ago": 30,
            },
            {
                "creator": amad,
                "days_ago": 60,
                "market": "El Paso",
                "location_type": "Store",
                "store": created_stores[11],
                "house": None,
                "category": "Brinks",
                "department": "Accounting",
                "priority": "High",
                "status": "Pending",
                "description": "Armored pickup vault lock jammed with cash canister inside. Brinks courier unable to extract deposit.",
                "assigned_to": None,
                "solved_by_team": None,
                "solved_by_name": None,
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": amad,
                "days_ago": 38,
                "market": "Houston",
                "location_type": "House",
                "store": None,
                "house": created_houses[2],
                "category": "Gas",
                "department": "Maintenance",
                "priority": "High",
                "status": "Close",
                "description": "Centerpoint Energy flagged gas pilot sensor variance at corporate housing furnace.",
                "assigned_to": saunders,
                "solved_by_team": "External",
                "solved_by_name": "Saunders Contractor Services",
                "images": [],
                "attachments": [{"name": "gas_cert.pdf", "url": "/uploads/gas_cert.pdf"}],
                "payment_required": True,
                "payment_method": "Company Mastercard",
                "card_last_four": "1044",
                "payment_amount": 289.00,
                "invoice_url": "/uploads/gas_cert.pdf",
                "closing_notes": "Cleaned thermocouple and passed safety pressure test with city inspector sign-off.",
                "closing_checklist_verified": True,
                "closed_days_ago": 15,
            },
            {
                "creator": amad,
                "days_ago": 41,
                "market": "Bay Area",
                "location_type": "House",
                "store": None,
                "house": created_houses[3],
                "category": "Internet",
                "department": "IT",
                "priority": "Medium",
                "status": "Completed",
                "description": "Comcast Business fiber gateway upgraded to 1Gbps symmetrical at San Francisco house.",
                "assigned_to": mukkaram,
                "solved_by_team": "Internal",
                "solved_by_name": "Mukkaram Shareef",
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": amad,
                "days_ago": 18,
                "market": "Arizona",
                "location_type": "Store",
                "store": created_stores[0],
                "house": None,
                "category": "RMA",
                "department": "Ordering",
                "priority": "Low",
                "status": "Open",
                "description": "Defective demo Samsung Galaxy handsets packaged for OEM return processing.",
                "assigned_to": amad,
                "solved_by_team": "Internal",
                "solved_by_name": "Amad Hussain",
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": faizan,
                "days_ago": 5,
                "market": "Memphis",
                "location_type": "Store",
                "store": created_stores[9],
                "house": None,
                "category": "Dumpster",
                "department": "Maintenance",
                "priority": "Low",
                "status": "Assigned",
                "description": "Rear corridor dumpster enclosure gate latch broken, requires welding repair.",
                "assigned_to": maqadam,
                "solved_by_team": "Internal",
                "solved_by_name": "Maqadam Mustfa",
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
            {
                "creator": amad,
                "days_ago": 1,
                "market": "Bay Area",
                "location_type": "Store",
                "store": created_stores[5],
                "house": None,
                "category": "Travel",
                "department": "Admin",
                "priority": "Medium",
                "status": "Pending",
                "description": "Travel reimbursement and hotel booking request for MM district site inspections.",
                "assigned_to": None,
                "solved_by_team": None,
                "solved_by_name": None,
                "images": [],
                "attachments": [],
                "payment_required": False,
            },
        ]

        for spec in tickets_specs:
            created_date = now - timedelta(days=spec["days_ago"])
            closed_date = None
            if spec.get("status") == "Close" and "closed_days_ago" in spec:
                closed_date = now - timedelta(days=spec["closed_days_ago"])
            elif spec.get("status") == "Close":
                closed_date = now - timedelta(days=1)

            loc_disp = ""
            if spec["location_type"] == "Store" and spec["store"]:
                loc_disp = f"Store: {spec['store'].tech_id} - {spec['store'].store_name}"
            elif spec["location_type"] == "House" and spec["house"]:
                loc_disp = f"House: {spec['house'].house_name} ({spec['house'].address})"

            ticket = models.Ticket(
                creator_id=spec["creator"].id,
                creator_name=spec["creator"].name,
                creator_email=spec["creator"].email,
                creator_phone=spec["creator"].phone,
                market=spec["market"],
                location_type=spec["location_type"],
                store_id=spec["store"].id if spec["store"] else None,
                house_id=spec["house"].id if spec["house"] else None,
                location_display=loc_disp,
                category=spec["category"],
                department=spec["department"],
                priority=spec["priority"],
                status=spec["status"],
                description=spec["description"],
                assigned_to_id=spec["assigned_to"].id if spec.get("assigned_to") else None,
                assigned_to_name=spec["assigned_to"].name if spec.get("assigned_to") else None,
                solved_by_team=spec.get("solved_by_team"),
                solved_by_name=spec.get("solved_by_name"),
                images=spec.get("images", []),
                attachments=spec.get("attachments", []),
                payment_required=spec.get("payment_required", False),
                payment_method=spec.get("payment_method"),
                card_last_four=spec.get("card_last_four"),
                payment_amount=spec.get("payment_amount"),
                invoice_url=spec.get("invoice_url"),
                closing_notes=spec.get("closing_notes"),
                closing_checklist_verified=spec.get("closing_checklist_verified", False),
                created_at=created_date,
                updated_at=created_date + timedelta(hours=4),
                closed_at=closed_date,
            )
            db.add(ticket)

        db.commit()
        print("[Seed] Successfully seeded Techno Communications database!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

