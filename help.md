### Help Log Retriever

-w Number - default: 0: current week, 1 last week, etc.
-m Number - month index 1-12
-r Number - default: 0: multiplier for time that accounts for context switches in percent e.g. 20 is 120%

-c clientKey - generate invoice for client, set in the settings.json under root/clients

-vat Number- percentile (%) VAT of the current invoice: defaults to 0.
-date Date - date in any format moment can eat, defaults to today.
-id Number - defaults to invoices.json's last entry. If ID already exists, it will get overwritten.

-save - save the invoice into the invoice store
-overwrite - if the invoice ID already exists, use this to overwrite the existing in the store.