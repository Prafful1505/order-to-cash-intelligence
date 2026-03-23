from sqlalchemy import Column, Date, Numeric, String
from app.database import Base


class SalesOrderHeader(Base):
    __tablename__ = "sales_order_headers"

    sales_order = Column(String, primary_key=True)
    sales_order_type = Column(String)
    sold_to_party = Column(String, index=True)
    sales_organization = Column(String)
    distribution_channel = Column(String)
    total_net_amount = Column(Numeric(15, 2))
    transaction_currency = Column(String(3))
    overall_delivery_status = Column(String)
    overall_ord_reltd_bilg_status = Column(String)
    creation_date = Column(Date)
    requested_delivery_date = Column(Date)
    customer_payment_terms = Column(String)
    incoterms_classification = Column(String)
    incoterms_location1 = Column(String)
    delivery_block_reason = Column(String)
    header_billing_block_reason = Column(String)


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    sales_order = Column(String, primary_key=True)
    sales_order_item = Column(String, primary_key=True)
    sales_order_item_category = Column(String)
    material = Column(String, index=True)
    requested_quantity = Column(Numeric(15, 3))
    requested_quantity_unit = Column(String)
    net_amount = Column(Numeric(15, 2))
    transaction_currency = Column(String(3))
    material_group = Column(String)
    production_plant = Column(String)
    storage_location = Column(String)
    sales_document_rjcn_reason = Column(String)
    item_billing_block_reason = Column(String)
