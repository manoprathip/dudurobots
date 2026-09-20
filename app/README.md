# DUDU Delivery App MVP

This is the first static product prototype for DUDU.

## Routes
- /app/ — customer ordering and tracking experience
- /app/admin.html — DUDU operations / fleet dashboard

## Phase 1
The current UI is a clickable prototype. Merchant data, orders, tracking states and robot positions are demo data stored in the browser.

## Phase 2
Connect:
1. Authentication
2. PostgreSQL/Supabase database
3. Restaurant/retailer order APIs
4. Payment provider
5. Real-time order status
6. Robot fleet API / WebSocket
7. Push notifications
8. Operator authentication and permissions

Do not expose robot credentials or payment secrets in frontend code.
