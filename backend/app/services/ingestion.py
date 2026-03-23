"""
Data ingestion service — loads all JSONL folders into SQLite via SQLAlchemy.

Run directly:
    cd backend
    source venv/Scripts/activate
    py -m app.services.ingestion
"""

import glob
import json
import os
import sys
from datetime import date, datetime
from pathlib import Path

# Allow `py -m app.services.ingestion` from the backend/ directory
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.database import Base, SessionLocal, engine
import app.models  # noqa — registers all ORM models with Base
from app.models.business_partner import BusinessPartner, PartnerAddress
from app.models.billing import BillingDocHeader, BillingDocItem
from app.models.delivery import DeliveryHeader, DeliveryItem
from app.models.order import SalesOrderHeader, SalesOrderItem
from app.models.payment import Payment
from app.models.product import Product, ProductDescription

DATA_ROOT = Path(__file__).resolve().parents[2] / "data" / "sap-order-to-cash-dataset" / "sap-o2c-data"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_jsonl(folder: str) -> list[dict]:
    """Return every record from all part-*.jsonl files in a folder."""
    records: list[dict] = []
    pattern = str(DATA_ROOT / folder / "*.jsonl")
    for filepath in sorted(glob.glob(pattern)):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    records.append(json.loads(line))
    return records


def parse_date(value: object) -> date | None:
    """Parse ISO-8601 date strings like '2025-03-31T00:00:00.000Z'."""
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
    except (ValueError, TypeError):
        return None


def to_decimal(value: object):
    """Return None for empty/null, otherwise keep as-is (SQLAlchemy handles Numeric)."""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Per-table loaders
# ---------------------------------------------------------------------------

def ingest_business_partners(records: list[dict], db) -> int:
    for r in records:
        obj = BusinessPartner(
            business_partner=r["businessPartner"],
            customer=r.get("customer"),
            business_partner_full_name=r.get("businessPartnerFullName"),
            business_partner_name=r.get("businessPartnerName"),
            business_partner_category=r.get("businessPartnerCategory"),
            business_partner_grouping=r.get("businessPartnerGrouping"),
            business_partner_is_blocked=bool(r.get("businessPartnerIsBlocked", False)),
            is_marked_for_archiving=bool(r.get("isMarkedForArchiving", False)),
            creation_date=parse_date(r.get("creationDate")),
            last_change_date=parse_date(r.get("lastChangeDate")),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_partner_addresses(records: list[dict], db) -> int:
    for r in records:
        obj = PartnerAddress(
            business_partner=r["businessPartner"],
            address_id=r["addressId"],
            city_name=r.get("cityName"),
            country=r.get("country"),
            postal_code=r.get("postalCode"),
            region=r.get("region"),
            street_name=r.get("streetName"),
            address_time_zone=r.get("addressTimeZone"),
            validity_start_date=parse_date(r.get("validityStartDate")),
            validity_end_date=parse_date(r.get("validityEndDate")),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_products(records: list[dict], db) -> int:
    for r in records:
        obj = Product(
            product=r["product"],
            product_type=r.get("productType"),
            product_old_id=r.get("productOldId"),
            product_group=r.get("productGroup"),
            base_unit=r.get("baseUnit"),
            division=r.get("division"),
            gross_weight=to_decimal(r.get("grossWeight")),
            net_weight=to_decimal(r.get("netWeight")),
            weight_unit=r.get("weightUnit"),
            is_marked_for_deletion=bool(r.get("isMarkedForDeletion", False)),
            creation_date=parse_date(r.get("creationDate")),
            last_change_date=parse_date(r.get("lastChangeDate")),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_product_descriptions(records: list[dict], db) -> int:
    for r in records:
        obj = ProductDescription(
            product=r["product"],
            language=r.get("language", "EN"),
            product_description=r.get("productDescription"),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_sales_order_headers(records: list[dict], db) -> int:
    for r in records:
        obj = SalesOrderHeader(
            sales_order=r["salesOrder"],
            sales_order_type=r.get("salesOrderType"),
            sold_to_party=r.get("soldToParty"),
            sales_organization=r.get("salesOrganization"),
            distribution_channel=r.get("distributionChannel"),
            total_net_amount=to_decimal(r.get("totalNetAmount")),
            transaction_currency=r.get("transactionCurrency"),
            overall_delivery_status=r.get("overallDeliveryStatus"),
            overall_ord_reltd_bilg_status=r.get("overallOrdReltdBillgStatus"),
            creation_date=parse_date(r.get("creationDate")),
            requested_delivery_date=parse_date(r.get("requestedDeliveryDate")),
            customer_payment_terms=r.get("customerPaymentTerms"),
            incoterms_classification=r.get("incotermsClassification"),
            incoterms_location1=r.get("incotermsLocation1"),
            delivery_block_reason=r.get("deliveryBlockReason"),
            header_billing_block_reason=r.get("headerBillingBlockReason"),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_sales_order_items(records: list[dict], db) -> int:
    for r in records:
        obj = SalesOrderItem(
            sales_order=r["salesOrder"],
            sales_order_item=r["salesOrderItem"],
            sales_order_item_category=r.get("salesOrderItemCategory"),
            material=r.get("material"),
            requested_quantity=to_decimal(r.get("requestedQuantity")),
            requested_quantity_unit=r.get("requestedQuantityUnit"),
            net_amount=to_decimal(r.get("netAmount")),
            transaction_currency=r.get("transactionCurrency"),
            material_group=r.get("materialGroup"),
            production_plant=r.get("productionPlant"),
            storage_location=r.get("storageLocation"),
            sales_document_rjcn_reason=r.get("salesDocumentRjcnReason"),
            item_billing_block_reason=r.get("itemBillingBlockReason"),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_delivery_headers(records: list[dict], db) -> int:
    for r in records:
        obj = DeliveryHeader(
            delivery_document=r["deliveryDocument"],
            shipping_point=r.get("shippingPoint"),
            overall_goods_movement_status=r.get("overallGoodsMovementStatus"),
            overall_picking_status=r.get("overallPickingStatus"),
            hdr_general_incompletion_status=r.get("hdrGeneralIncompletionStatus"),
            delivery_block_reason=r.get("deliveryBlockReason"),
            header_billing_block_reason=r.get("headerBillingBlockReason"),
            creation_date=parse_date(r.get("creationDate")),
            actual_goods_movement_date=parse_date(r.get("actualGoodsMovementDate")),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_delivery_items(records: list[dict], db) -> int:
    for r in records:
        obj = DeliveryItem(
            delivery_document=r["deliveryDocument"],
            delivery_document_item=r["deliveryDocumentItem"],
            reference_sd_document=r.get("referenceSdDocument"),
            reference_sd_document_item=r.get("referenceSdDocumentItem"),
            plant=r.get("plant"),
            storage_location=r.get("storageLocation"),
            actual_delivery_quantity=to_decimal(r.get("actualDeliveryQuantity")),
            delivery_quantity_unit=r.get("deliveryQuantityUnit"),
            batch=r.get("batch"),
            item_billing_block_reason=r.get("itemBillingBlockReason"),
            last_change_date=parse_date(r.get("lastChangeDate")),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_billing_headers(records: list[dict], db) -> int:
    for r in records:
        obj = BillingDocHeader(
            billing_document=r["billingDocument"],
            billing_document_type=r.get("billingDocumentType"),
            sold_to_party=r.get("soldToParty"),
            total_net_amount=to_decimal(r.get("totalNetAmount")),
            transaction_currency=r.get("transactionCurrency"),
            company_code=r.get("companyCode"),
            fiscal_year=r.get("fiscalYear"),
            accounting_document=r.get("accountingDocument"),
            billing_document_date=parse_date(r.get("billingDocumentDate")),
            billing_document_is_cancelled=bool(r.get("billingDocumentIsCancelled", False)),
            cancelled_billing_document=r.get("cancelledBillingDocument"),
            creation_date=parse_date(r.get("creationDate")),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_billing_items(records: list[dict], db) -> int:
    for r in records:
        obj = BillingDocItem(
            billing_document=r["billingDocument"],
            billing_document_item=r["billingDocumentItem"],
            material=r.get("material"),
            billing_quantity=to_decimal(r.get("billingQuantity")),
            billing_quantity_unit=r.get("billingQuantityUnit"),
            net_amount=to_decimal(r.get("netAmount")),
            transaction_currency=r.get("transactionCurrency"),
            reference_sd_document=r.get("referenceSdDocument"),
            reference_sd_document_item=r.get("referenceSdDocumentItem"),
        )
        db.merge(obj)
    db.commit()
    return len(records)


def ingest_payments(records: list[dict], db) -> int:
    for r in records:
        obj = Payment(
            accounting_document=r["accountingDocument"],
            accounting_document_item=r["accountingDocumentItem"],
            fiscal_year=r["fiscalYear"],
            company_code=r.get("companyCode"),
            customer=r.get("customer"),
            clearing_accounting_document=r.get("clearingAccountingDocument"),
            clearing_doc_fiscal_year=r.get("clearingDocFiscalYear"),
            clearing_date=parse_date(r.get("clearingDate")),
            amount_in_transaction_currency=to_decimal(r.get("amountInTransactionCurrency")),
            transaction_currency=r.get("transactionCurrency"),
            amount_in_company_code_currency=to_decimal(r.get("amountInCompanyCodeCurrency")),
            company_code_currency=r.get("companyCodeCurrency"),
            invoice_reference=r.get("invoiceReference"),
            invoice_reference_fiscal_year=r.get("invoiceReferenceFiscalYear"),
            sales_document=r.get("salesDocument"),
            sales_document_item=r.get("salesDocumentItem"),
            posting_date=parse_date(r.get("postingDate")),
            document_date=parse_date(r.get("documentDate")),
            gl_account=r.get("glAccount"),
            financial_account_type=r.get("financialAccountType"),
            profit_center=r.get("profitCenter"),
        )
        db.merge(obj)
    db.commit()
    return len(records)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

STEPS = [
    ("business_partners",               ingest_business_partners),
    ("business_partner_addresses",      ingest_partner_addresses),
    ("products",                        ingest_products),
    ("product_descriptions",            ingest_product_descriptions),
    ("sales_order_headers",             ingest_sales_order_headers),
    ("sales_order_items",               ingest_sales_order_items),
    ("outbound_delivery_headers",       ingest_delivery_headers),
    ("outbound_delivery_items",         ingest_delivery_items),
    ("billing_document_headers",        ingest_billing_headers),
    ("billing_document_items",          ingest_billing_items),
    ("payments_accounts_receivable",    ingest_payments),
]


def run():
    print("Creating tables…")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for folder, fn in STEPS:
            records = load_jsonl(folder)
            count = fn(records, db)
            print(f"  {folder:<42} {count:>5} rows")
    finally:
        db.close()

    print("\nIngestion complete.")


if __name__ == "__main__":
    run()
