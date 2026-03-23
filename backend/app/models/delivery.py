from sqlalchemy import Column, Date, Numeric, String
from app.database import Base


class DeliveryHeader(Base):
    __tablename__ = "outbound_delivery_headers"

    delivery_document = Column(String, primary_key=True)
    shipping_point = Column(String)
    overall_goods_movement_status = Column(String)
    overall_picking_status = Column(String)
    hdr_general_incompletion_status = Column(String)
    delivery_block_reason = Column(String)
    header_billing_block_reason = Column(String)
    creation_date = Column(Date)
    actual_goods_movement_date = Column(Date)


class DeliveryItem(Base):
    __tablename__ = "outbound_delivery_items"

    delivery_document = Column(String, primary_key=True)
    delivery_document_item = Column(String, primary_key=True)
    reference_sd_document = Column(String, index=True)   # links back to sales order
    reference_sd_document_item = Column(String)
    plant = Column(String)
    storage_location = Column(String)
    actual_delivery_quantity = Column(Numeric(15, 3))
    delivery_quantity_unit = Column(String)
    batch = Column(String)
    item_billing_block_reason = Column(String)
    last_change_date = Column(Date)
