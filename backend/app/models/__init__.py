# Import all models so SQLAlchemy registers them before create_all()
from app.models.business_partner import BusinessPartner, PartnerAddress
from app.models.product import Product, ProductDescription
from app.models.order import SalesOrderHeader, SalesOrderItem
from app.models.delivery import DeliveryHeader, DeliveryItem
from app.models.billing import BillingDocHeader, BillingDocItem
from app.models.payment import Payment

__all__ = [
    "BusinessPartner",
    "PartnerAddress",
    "Product",
    "ProductDescription",
    "SalesOrderHeader",
    "SalesOrderItem",
    "DeliveryHeader",
    "DeliveryItem",
    "BillingDocHeader",
    "BillingDocItem",
    "Payment",
]
