from sqlalchemy import Column, Date, Numeric, String
from app.database import Base


class Payment(Base):
    __tablename__ = "payments_accounts_receivable"

    accounting_document = Column(String, primary_key=True)
    accounting_document_item = Column(String, primary_key=True)
    fiscal_year = Column(String, primary_key=True)
    company_code = Column(String)
    customer = Column(String, index=True)
    clearing_accounting_document = Column(String)
    clearing_doc_fiscal_year = Column(String)
    clearing_date = Column(Date)
    amount_in_transaction_currency = Column(Numeric(15, 2))
    transaction_currency = Column(String(3))
    amount_in_company_code_currency = Column(Numeric(15, 2))
    company_code_currency = Column(String(3))
    invoice_reference = Column(String, index=True)
    invoice_reference_fiscal_year = Column(String)
    sales_document = Column(String, index=True)
    sales_document_item = Column(String)
    posting_date = Column(Date)
    document_date = Column(Date)
    gl_account = Column(String)
    financial_account_type = Column(String)
    profit_center = Column(String)
