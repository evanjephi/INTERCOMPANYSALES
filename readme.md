# Intercompany Order Processing Automation - int_record_sync

This workflow action script creates a purchase order from the triggering record and carries over the key header and line-item details needed for intercompany processing. It sets the vendor, links the source sales order, calculates the due date from the ship date, and copies each item line at 40% of the original rate.

The script also maps the source order type to the appropriate class and writes a debug log after the purchase order is saved. A sales-order follow-up block is present in the script, but the implementation is not yet completed.
