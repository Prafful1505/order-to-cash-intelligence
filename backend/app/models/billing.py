from sqlalchemy import Boolean, Column, Date, Numeric, String
from app.database import Base


class BillingDocHeader(Base):
    __tablename__ = "billing_document_headers"

    billing_document = Column(String, primary_key=True)
    billing_document_type = Column(String)
    sold_to_party = Column(String, index=True)
    total_net_amount = Column(Numeric(15, 2))
    transaction_currency = Column(String(3))
    company_code = Column(String)
    fiscal_year = Column(String)
    accounting_document = Column(String)
    billing_document_date = Column(Date)
    billing_document_is_cancelled = Column(Boolean, default=False)
    cancelled_billing_document = Column(String)
    creation_date = Column(Date)


class BillingDocItem(Base):
    __tablename__ = "billing_document_items"

    billing_document = Column(String, primary_key=True)
    billing_document_item = Column(String, primary_key=True)
    material = Column(String, index=True)
    billing_quantity = Column(Numeric(15, 3))
    billing_quantity_unit = Column(String)
    net_amount = Column(Numeric(15, 2))
    transaction_currency = Column(String(3))
    reference_sd_document = Column(String, index=True)   # delivery doc
    reference_sd_document_item = Column(String)
