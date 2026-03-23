"""
Graph builder — constructs an in-memory NetworkX DiGraph from SQLite at startup.

Node ID format:  {type}_{primary_key}
Node types:      customer, address, product, order, order_item,
                 delivery, billing_doc, payment
"""

import networkx as nx
from sqlalchemy.orm import Session

from app.models.business_partner import BusinessPartner, PartnerAddress
from app.models.billing import BillingDocHeader, BillingDocItem
from app.models.delivery import DeliveryHeader, DeliveryItem
from app.models.order import SalesOrderHeader, SalesOrderItem
from app.models.payment import Payment
from app.models.product import Product, ProductDescription

_graph: nx.DiGraph | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _str(v) -> str | None:
    return str(v) if v is not None else None


def _float(v) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def build_graph(db: Session) -> nx.DiGraph:
    G = nx.DiGraph()

    # --- Product descriptions (for labels) ---
    prod_desc: dict[str, str] = {
        pd.product: pd.product_description or pd.product
        for pd in db.query(ProductDescription).filter(ProductDescription.language == "EN").all()
    }

    # ------------------------------------------------------------------ #
    # NODES                                                                #
    # ------------------------------------------------------------------ #

    # Customers (BusinessPartner)
    for bp in db.query(BusinessPartner).all():
        nid = f"customer_{bp.business_partner}"
        G.add_node(nid, type="customer",
                   label=bp.business_partner_full_name or bp.business_partner,
                   properties={
                       "partner_id": bp.business_partner,
                       "customer_id": bp.customer,
                       "name": bp.business_partner_full_name,
                       "category": bp.business_partner_category,
                       "grouping": bp.business_partner_grouping,
                       "is_blocked": bp.business_partner_is_blocked,
                       "creation_date": _str(bp.creation_date),
                   })

    # Addresses
    for addr in db.query(PartnerAddress).all():
        nid = f"address_{addr.business_partner}_{addr.address_id}"
        G.add_node(nid, type="address",
                   label=f"{addr.street_name}, {addr.city_name}",
                   properties={
                       "business_partner": addr.business_partner,
                       "address_id": addr.address_id,
                       "street": addr.street_name,
                       "city": addr.city_name,
                       "postal_code": addr.postal_code,
                       "region": addr.region,
                       "country": addr.country,
                   })

    # Products
    for prod in db.query(Product).all():
        nid = f"product_{prod.product}"
        G.add_node(nid, type="product",
                   label=prod_desc.get(prod.product, prod.product),
                   properties={
                       "product_id": prod.product,
                       "old_id": prod.product_old_id,
                       "product_group": prod.product_group,
                       "base_unit": prod.base_unit,
                       "division": prod.division,
                       "description": prod_desc.get(prod.product),
                   })

    # Sales Order Headers
    for order in db.query(SalesOrderHeader).all():
        nid = f"order_{order.sales_order}"
        G.add_node(nid, type="order",
                   label=f"SO-{order.sales_order}",
                   properties={
                       "order_id": order.sales_order,
                       "customer_id": order.sold_to_party,
                       "order_date": _str(order.creation_date),
                       "requested_delivery_date": _str(order.requested_delivery_date),
                       "net_amount": _float(order.total_net_amount),
                       "currency": order.transaction_currency,
                       "delivery_status": order.overall_delivery_status,
                       "billing_status": order.overall_ord_reltd_bilg_status,
                       "order_type": order.sales_order_type,
                       "payment_terms": order.customer_payment_terms,
                   })

    # Sales Order Items
    for item in db.query(SalesOrderItem).all():
        nid = f"order_item_{item.sales_order}_{item.sales_order_item}"
        G.add_node(nid, type="order_item",
                   label=f"Item {item.sales_order_item} of SO-{item.sales_order}",
                   properties={
                       "order_id": item.sales_order,
                       "item_number": item.sales_order_item,
                       "material": item.material,
                       "quantity": _float(item.requested_quantity),
                       "unit": item.requested_quantity_unit,
                       "net_amount": _float(item.net_amount),
                       "currency": item.transaction_currency,
                       "plant": item.production_plant,
                       "material_group": item.material_group,
                   })

    # Delivery Headers
    for dh in db.query(DeliveryHeader).all():
        nid = f"delivery_{dh.delivery_document}"
        G.add_node(nid, type="delivery",
                   label=f"DEL-{dh.delivery_document}",
                   properties={
                       "delivery_id": dh.delivery_document,
                       "shipping_point": dh.shipping_point,
                       "goods_movement_status": dh.overall_goods_movement_status,
                       "picking_status": dh.overall_picking_status,
                       "creation_date": _str(dh.creation_date),
                       "actual_goods_movement_date": _str(dh.actual_goods_movement_date),
                   })

    # Billing Document Headers
    for bh in db.query(BillingDocHeader).all():
        nid = f"billing_doc_{bh.billing_document}"
        G.add_node(nid, type="billing_doc",
                   label=f"BILL-{bh.billing_document}",
                   properties={
                       "billing_doc_id": bh.billing_document,
                       "billing_type": bh.billing_document_type,
                       "customer_id": bh.sold_to_party,
                       "net_amount": _float(bh.total_net_amount),
                       "currency": bh.transaction_currency,
                       "billing_date": _str(bh.billing_document_date),
                       "creation_date": _str(bh.creation_date),
                       "fiscal_year": bh.fiscal_year,
                       "accounting_document": bh.accounting_document,
                       "is_cancelled": bh.billing_document_is_cancelled,
                   })

    # Payments
    for pmt in db.query(Payment).all():
        nid = f"payment_{pmt.accounting_document}_{pmt.accounting_document_item}"
        G.add_node(nid, type="payment",
                   label=f"PAY-{pmt.accounting_document}/{pmt.accounting_document_item}",
                   properties={
                       "accounting_document": pmt.accounting_document,
                       "item": pmt.accounting_document_item,
                       "customer_id": pmt.customer,
                       "amount": _float(pmt.amount_in_transaction_currency),
                       "currency": pmt.transaction_currency,
                       "clearing_date": _str(pmt.clearing_date),
                       "posting_date": _str(pmt.posting_date),
                       "gl_account": pmt.gl_account,
                       "clearing_document": pmt.clearing_accounting_document,
                   })

    # ------------------------------------------------------------------ #
    # EDGES                                                                #
    # ------------------------------------------------------------------ #

    # customer → address  (HAS_ADDRESS)
    for addr in db.query(PartnerAddress).all():
        src = f"customer_{addr.business_partner}"
        tgt = f"address_{addr.business_partner}_{addr.address_id}"
        if src in G and tgt in G:
            G.add_edge(src, tgt, relationship="HAS_ADDRESS")

    # customer → order  (PLACED)
    for order in db.query(SalesOrderHeader).all():
        if order.sold_to_party:
            src = f"customer_{order.sold_to_party}"
            tgt = f"order_{order.sales_order}"
            if src in G and tgt in G:
                G.add_edge(src, tgt, relationship="PLACED")

    # order → order_item  (CONTAINS)
    for item in db.query(SalesOrderItem).all():
        src = f"order_{item.sales_order}"
        tgt = f"order_item_{item.sales_order}_{item.sales_order_item}"
        if src in G and tgt in G:
            G.add_edge(src, tgt, relationship="CONTAINS")

    # order_item → product  (IS_PRODUCT)
    for item in db.query(SalesOrderItem).all():
        if item.material:
            src = f"order_item_{item.sales_order}_{item.sales_order_item}"
            tgt = f"product_{item.material}"
            if src in G and tgt in G:
                G.add_edge(src, tgt, relationship="IS_PRODUCT")

    # order → delivery  (HAS_DELIVERY)
    # Link is: delivery_items.reference_sd_document = sales_order
    seen_order_delivery: set[tuple] = set()
    for di in db.query(DeliveryItem).all():
        if di.reference_sd_document:
            pair = (di.reference_sd_document, di.delivery_document)
            if pair not in seen_order_delivery:
                seen_order_delivery.add(pair)
                src = f"order_{di.reference_sd_document}"
                tgt = f"delivery_{di.delivery_document}"
                if src in G and tgt in G:
                    G.add_edge(src, tgt, relationship="HAS_DELIVERY")

    # delivery → billing_doc  (BILLED_AS)
    # Link is: billing_doc_items.reference_sd_document = delivery_document
    seen_del_billing: set[tuple] = set()
    for bi in db.query(BillingDocItem).all():
        if bi.reference_sd_document:
            pair = (bi.reference_sd_document, bi.billing_document)
            if pair not in seen_del_billing:
                seen_del_billing.add(pair)
                src = f"delivery_{bi.reference_sd_document}"
                tgt = f"billing_doc_{bi.billing_document}"
                if src in G and tgt in G:
                    G.add_edge(src, tgt, relationship="BILLED_AS")

    # billing_doc → payment  (PAID_BY)
    # Link is: billing_doc_headers.accounting_document = payments.accounting_document
    acct_to_billing: dict[str, str] = {
        bh.accounting_document: bh.billing_document
        for bh in db.query(BillingDocHeader).all()
        if bh.accounting_document
    }
    for pmt in db.query(Payment).all():
        billing_doc = acct_to_billing.get(pmt.accounting_document)
        if billing_doc:
            src = f"billing_doc_{billing_doc}"
            tgt = f"payment_{pmt.accounting_document}_{pmt.accounting_document_item}"
            if src in G and tgt in G:
                G.add_edge(src, tgt, relationship="PAID_BY")

    return G


# ---------------------------------------------------------------------------
# Singleton accessors
# ---------------------------------------------------------------------------

def get_graph() -> nx.DiGraph:
    if _graph is None:
        raise RuntimeError("Graph not initialized. Call init_graph() at startup.")
    return _graph


def init_graph(db: Session) -> None:
    global _graph
    _graph = build_graph(db)
    print(
        f"Graph built: {_graph.number_of_nodes()} nodes, "
        f"{_graph.number_of_edges()} edges"
    )
