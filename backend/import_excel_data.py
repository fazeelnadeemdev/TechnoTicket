import os
import re
from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

CANDIDATE_SEARCH_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
    os.path.abspath(os.path.dirname(__file__)),
    os.path.expanduser("~/Downloads"),
    "C:/Users/Lenovo/Downloads",
    os.path.expanduser("~/Desktop"),
    "C:/Users/Lenovo/Desktop",
]

def find_file(filename: str) -> str:
    for base in CANDIDATE_SEARCH_PATHS:
        candidate = os.path.join(base, filename)
        if os.path.exists(candidate):
            return candidate
    return ""

def clean_val(val) -> str:
    """Helper to convert cell values to clean strings without .0 or NaN."""
    if pd.isna(val) or val is None:
        return ""
    if isinstance(val, (float, int)):
        if isinstance(val, float) and val.is_integer():
            return str(int(val)).strip()
        elif isinstance(val, int):
            return str(val).strip()
    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s

def clean_date_str(val) -> str:
    if pd.isna(val) or val is None:
        return ""
    if isinstance(val, (datetime, pd.Timestamp)):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    return "" if s.lower() in ("nan", "nat", "none") else s

def import_all_excel_data(db: Session = None, force: bool = False):
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Recreate tables to ensure schema reflects new columns
        if force:
            try:
                models.Store.__table__.drop(engine, checkfirst=True)
                models.House.__table__.drop(engine, checkfirst=True)
                models.MMDMInfo.__table__.drop(engine, checkfirst=True)
            except Exception as e:
                print(f"[Excel Import] Table drop note: {e}")
        Base.metadata.create_all(bind=engine)

        # 1. Locate Market Structure.xlsx
        market_file = find_file("Market Structure.xlsx")
        home_rental_file = find_file("Master Sheet - Market Home Rental.xlsx")

        if not market_file:
            print("[Excel Import] Warning: 'Market Structure.xlsx' not found. Skipping stores & MM/DM import.")
        else:
            print(f"[Excel Import] Reading '{market_file}'...")

            # --- A. Import Stores (Sheet: 'Market') ---
            existing_stores_count = db.query(models.Store).count()
            if existing_stores_count < 500 or force:
                print(f"[Excel Import] Importing stores from sheet 'Market'...")
                df_market = pd.read_excel(market_file, sheet_name="Market")
                
                # Clear existing dummy stores if forcing or initial
                if existing_stores_count > 0 and force:
                    db.query(models.Store).delete()
                    db.commit()

                stores_to_add = []
                for _, row in df_market.iterrows():
                    tech_id = clean_val(row.get("BDI ID"))
                    store_name = clean_val(row.get("Store Name"))
                    if not tech_id or not store_name:
                        continue

                    market_raw = clean_val(row.get("Market"))
                    market = market_raw.upper() if market_raw else "UNASSIGNED"
                    dm_name = clean_val(row.get("DM Name"))
                    district = clean_val(row.get("District"))
                    door_code = clean_val(row.get("Door Code"))
                    tmobile_loc_id = clean_val(row.get("T Mobile Location ID"))
                    edge_id = clean_val(row.get("EDGE ID"))
                    magenta_code = clean_val(row.get("Magenta Sales Code"))
                    store_address = clean_val(row.get("Store Address")) or store_name
                    state = clean_val(row.get("State"))
                    phone = clean_val(row.get("Store Phone Number"))
                    email = clean_val(row.get("Store Email"))

                    store_obj = models.Store(
                        tech_id=tech_id,
                        store_name=store_name,
                        market=market,
                        dm_name=dm_name or None,
                        district=district or None,
                        door_code=door_code or None,
                        tmobile_location_id=tmobile_loc_id or None,
                        edge_id=edge_id or None,
                        magenta_sales_code=magenta_code or None,
                        store_address=store_address,
                        state=state or None,
                        store_phone=phone or None,
                        store_email=email or None,
                    )
                    stores_to_add.append(store_obj)

                db.bulk_save_objects(stores_to_add)
                db.commit()
                print(f"[Excel Import] Successfully imported {len(stores_to_add)} stores into database!")

            # --- B. Import MM/DM Leadership Directory (Sheet: 'MMDM Info') ---
            existing_mmdm_count = db.query(models.MMDMInfo).count()
            if existing_mmdm_count < 100 or force:
                print(f"[Excel Import] Importing leadership directory from sheet 'MMDM Info'...")
                df_mmdm = pd.read_excel(market_file, sheet_name="MMDM Info")
                df_mmdm_valid = df_mmdm[df_mmdm["Name"].notna()]

                if existing_mmdm_count > 0 and force:
                    db.query(models.MMDMInfo).delete()
                    db.commit()

                mmdm_to_add = []
                for _, row in df_mmdm_valid.iterrows():
                    name = clean_val(row.get("Name"))
                    if not name:
                        continue

                    market_raw = clean_val(row.get("Market"))
                    market = market_raw.upper() if market_raw else "ALL MARKETS"
                    title = clean_val(row.get("Title"))
                    ntid = clean_val(row.get("NTID"))
                    email = clean_val(row.get("Company Email ID"))
                    phone = clean_val(row.get("Contact Number"))
                    bdi_login = clean_val(row.get("BDI LOGINS"))

                    rec = models.MMDMInfo(
                        market=market,
                        name=name,
                        title=title or None,
                        ntid=ntid or None,
                        email=email or None,
                        phone=phone or None,
                        bdi_login=bdi_login or None,
                    )
                    mmdm_to_add.append(rec)

                db.bulk_save_objects(mmdm_to_add)
                db.commit()
                print(f"[Excel Import] Successfully imported {len(mmdm_to_add)} leadership directory records!")

        # 2. Locate and Import Corporate Houses (Master Sheet - Market Home Rental.xlsx)
        if not home_rental_file:
            print("[Excel Import] Warning: 'Master Sheet - Market Home Rental.xlsx' not found. Skipping houses import.")
        else:
            print(f"[Excel Import] Reading '{home_rental_file}'...")
            existing_houses_count = db.query(models.House).count()
            if existing_houses_count < 150 or force:
                print(f"[Excel Import] Importing corporate houses from sheet 'Master Sheet'...")
                df_houses = pd.read_excel(home_rental_file, sheet_name="Master Sheet")
                df_houses_valid = df_houses[df_houses["Address"].notna()]

                if existing_houses_count > 0 and force:
                    db.query(models.House).delete()
                    db.commit()

                houses_to_add = []
                for _, row in df_houses_valid.iterrows():
                    address = clean_val(row.get("Address"))
                    if not address:
                        continue

                    status = clean_val(row.get("Status")) or "Active"
                    market_raw = clean_val(row.get("Market"))
                    market = market_raw.upper() if market_raw else "GENERAL"
                    code = clean_val(row.get("Code"))
                    lease_holders = clean_val(row.get("Lease Holders"))
                    mm_dm = clean_val(row.get("MM / DM"))
                    monthly_rent = clean_val(row.get("Monthly Rent"))
                    security_deposit = clean_val(row.get("Security Deposit"))
                    mode_payment = clean_val(row.get("Mode of Payment"))
                    lease_start = clean_date_str(row.get("Lease Start Date"))
                    lease_end = clean_date_str(row.get("Lease End Date"))
                    appliances = clean_val(row.get("Appliance List"))

                    # Exclude raw credentials completely from storage
                    house_obj = models.House(
                        status=status,
                        market=market,
                        house_code=code or None,
                        house_name=f"{code} - {address.split(',')[0]}" if code else address.split(",")[0],
                        address=address,
                        lease_holders=lease_holders or None,
                        mm_dm=mm_dm or None,
                        monthly_rent=monthly_rent or None,
                        security_deposit=security_deposit or None,
                        mode_of_payment=mode_payment or None,
                        lease_start_date=lease_start or None,
                        lease_end_date=lease_end or None,
                        appliance_list=appliances or None,
                    )
                    houses_to_add.append(house_obj)

                db.bulk_save_objects(houses_to_add)
                db.commit()
                print(f"[Excel Import] Successfully imported {len(houses_to_add)} corporate houses!")

    except Exception as e:
        db.rollback()
        print(f"[Excel Import] Error during Excel ingestion: {e}")
        raise e
    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    import_all_excel_data(force=True)
