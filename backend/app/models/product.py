from sqlalchemy import Boolean, Column, Date, Numeric, String
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    product = Column(String, primary_key=True)
    product_type = Column(String)
    product_old_id = Column(String)
    product_group = Column(String)
    base_unit = Column(String)
    division = Column(String)
    gross_weight = Column(Numeric(15, 4))
    net_weight = Column(Numeric(15, 4))
    weight_unit = Column(String)
    is_marked_for_deletion = Column(Boolean, default=False)
    creation_date = Column(Date)
    last_change_date = Column(Date)


class ProductDescription(Base):
    __tablename__ = "product_descriptions"

    product = Column(String, primary_key=True)
    language = Column(String, primary_key=True)
    product_description = Column(String)
