SELECT TOP 5 Id, QuoteNumber, RevisionNumber, Status FROM Quotations ORDER BY Id DESC;
SELECT TOP 5 QuotationId, COUNT(*) as ItemCount FROM QuotationsItem GROUP BY QuotationId ORDER BY QuotationId DESC;
