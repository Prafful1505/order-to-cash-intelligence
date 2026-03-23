from sqlalchemy import Boolean, Column, Date, String
from app.database import Base


class BusinessPartner(Base):
    __tablename__ = "business_partners"

    business_partner = Column(String, primary_key=True)
    customer = Column(String, index=True)
    business_partner_full_name = Column(String)
    business_partner_name = Column(String)
    business_partner_category = Column(String)
    business_partner_grouping = Column(String)
    business_partner_is_blocked = Column(Boolean, default=False)
    is_marked_for_archiving = Column(Boolean, default=False)
    creation_date = Column(Date)
    last_change_date = Column(Date)


class PartnerAddress(Base):
    __tablename__ = "business_partner_addresses"

    business_partner = Column(String, primary_key=True)
    address_id = Column(String, primary_key=True)
    city_name = Column(String)
    country = Column(String)
    postal_code = Column(String)
    region = Column(String)
    street_name = Column(String)
    address_time_zone = Column(String)
    validity_start_date = Column(Date)
    validity_end_date = Column(Date)
