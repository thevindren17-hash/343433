### Phase 1 Technical Execution Blueprint: Mister Mobile AI-Quoter Foundation

#### 1\. Project Vision & Technical Reasoning

The Mister Mobile AI-Quoter is the architectural cornerstone for transitioning Singapore’s second-hand mobile market into a professionalized, data-driven recommerce ecosystem. As a recognized market leader and winner of the  **Carousell InstantBuy Award** , Mister Mobile requires a platform that mirrors its operational excellence. This blueprint shifts the development paradigm from "vibe-coding" to a structured AI-assisted execution, ensuring that our "Pricing Power"—the ability to offer trade-in rates up to double the market average—is codified into our software.

##### Technical Rationale

* **Next.js (App Router):**  Optimal for high-performance, SEO-sensitive omnichannel retail. The App Router’s server components minimize client-side latency, critical for our 17+ branch network.  
* **Supabase (PostgreSQL):**  Provides the relational integrity necessary for the  **100 Steps Inspection**  regimen. Its row-level security (RLS) and real-time capabilities enable secure, multi-tenant access for retail and corporate clients.  
* **Structured AI Logic:**  By utilizing Supabase Edge Functions, we move calculation logic away from the client, preventing reverse engineering of our proprietary pricing moat while allowing AI agents to iterate on the pricing model without refactoring the core UI.

##### Core Tech Stack

Component,Technology,Selection Logic (Based on Source Context)  
Frontend Framework,Next.js 15 (App Router),"Maximizes omnichannel conversion via rapid, accessible UI."  
Backend / Database,Supabase (PostgreSQL),Maintains strict relational audit trails for ISO 9001/14001 compliance.  
Serverless Logic,Supabase Edge Functions,"Orchestrates ""Pricing Power"" calculations and PayNow QR generation."  
State Management,React Server Components,"Simplifies data fetching across the complex ""100 Steps"" form."  
Infrastructure,Vercel \+ Supabase,Scalable infrastructure to support high-turnover inventory and bulk B2B trade-ins.

#### 2\. Supabase Database Schema (SQL)

The following DDL defines the project’s foundation, prioritizing logical relational integrity and automated audit trails for  **ISO**  and  **CaseTrust**  compliance.  
\-- Extensions and Custom Types  
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  
CREATE TYPE device\_category AS ENUM ('New', 'Refurbished');  
CREATE TYPE quote\_status AS ENUM ('Pending', 'Inspected', 'Accepted', 'Completed', 'Expired');

\-- 1\. Locations Table (The 17-Branch Network)  
CREATE TABLE locations (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    branch\_name TEXT NOT NULL UNIQUE,  
    is\_active BOOLEAN DEFAULT true  
);

\-- 2\. Devices Table  
CREATE TABLE devices (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    brand TEXT NOT NULL, \-- Apple, Samsung, Honor, OPPO, Xiaomi, OnePlus, Nothing Phone, Huawei, Google Pixel, Asus, Nokia, Sony, LG, Realme, Vivo  
    model TEXT NOT NULL,  
    category device\_category NOT NULL,  
    base\_market\_price DECIMAL(10, 2),  
    created\_at TIMESTAMPTZ DEFAULT now()  
);

\-- 3\. Inspections Table (The "100 Steps" Regimen)  
CREATE TABLE inspections (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    device\_id UUID REFERENCES devices(id),  
    inspector\_id UUID NOT NULL,  
    inspection\_data JSONB NOT NULL, \-- Schema: {screen\_condition: int, battery\_health: int, icloud\_status: bool, camera\_functional: bool, chassis\_integrity: int}  
    audit\_trail TEXT, \-- Immutable log for ISO 9001 audits  
    passed\_all\_steps BOOLEAN DEFAULT false,  
    created\_at TIMESTAMPTZ DEFAULT now()  
);

\-- 4\. Quotes Table (Linked to Inspection for Trust Validation)  
CREATE TABLE quotes (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    inspection\_id UUID REFERENCES inspections(id) ON DELETE CASCADE,  
    location\_id UUID REFERENCES locations(id),  
    trade\_in\_value DECIMAL(10, 2\) NOT NULL,  
    repair\_offset DECIMAL(10, 2\) DEFAULT 0.00,  
    casetrust\_identifier TEXT, \-- Fair trading metadata  
    status quote\_status DEFAULT 'Pending',  
    warranty\_expiry TIMESTAMPTZ DEFAULT (now() \+ interval '30 days'),  
    return\_policy\_expiry TIMESTAMPTZ DEFAULT (now() \+ interval '7 days'), \-- "No Questions" Policy  
    expiry\_date TIMESTAMPTZ NOT NULL,  
    created\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Seed 17 Singapore Branches  
INSERT INTO locations (branch\_name) VALUES   
('Ang Mo Kio'), ('Bedok'), ('Bishan'), ('Boon Lay'), ('Bukit Panjang'),   
('Chinatown'), ('Geylang'), ('Hougang'), ('Jurong'), ('Marine Parade'),   
('Pasir Ris'), ('Potong Pasir'), ('Punggol'), ('Serangoon'), ('Tampines'),   
('Woodlands'), ('Yishun');

#### 3\. Frontend Functional Requirements: Quoting Interface

The frontend must be a high-performance, low-friction entry point for users to receive immediate valuations.

##### Directory Structure (Next.js App Router)

/app  
  /quotes  
    /new  
      page.tsx          \-- Form Orchestrator  
      /steps  
        identification.tsx \-- Brand/Model Search  
        assessment.tsx     \-- "100 Steps" UI (JSONB generator)  
        result.tsx         \-- PayNow QR & Value Display  
  /api  
    /calculate-premium   \-- Edge Function Proxy

##### Quoting Interface Checklist

* **Step 1: Device Identification**  
* Fuzzy-search dropdown for 15+ brands (Apple, Samsung, Honor, OPPO, Xiaomi, OnePlus, Nothing Phone, Huawei, Google Pixel, Asus, Nokia, Sony, LG, Realme, Vivo).  
* Real-time model filtering against the devices table.  
* **Step 2: Condition Assessment ("100 Steps" Module)**  
* The UI must generate a valid JSON payload for the inspection\_data field. Required keys:  
* screen\_status: (Flawless, Scratched, Cracked)  
* battery\_percentage: (integer 0-100)  
* lock\_status: (iCloud/FRP Unlocked toggle)  
* functionality\_check: (Camera, FaceID/TouchID, Speakers)  
* oem\_verification: (Checks if parts are original)  
* **Step 3: Instant Quote Generation**  
* Display of trade\_in\_value alongside the 30-day warranty and 7-day return policy badges.  
* Integration of a Singapore-specific transit branch selector (17 locations).

#### 4\. API Strategy & Serverless Logic

##### Pricing Power Execution Logic

Supabase Edge Functions will act as the secure computation layer, fetching data from restricted tables to calculate quotes.

* **Auth Check:**  Verify session and inspector permissions.  
* **Parity Analysis:**  The function executes a join across market\_volatility\_index and bulk\_purchase\_parity tables to determine current buyback liquidity.  
* **Refurbishment Calculation:**  Logic maps inspection\_data keys to cost offsets (e.g., screen\_status: 'Cracked' triggers a specific repair deduction).  
* **Premium Multiplier:**  Apply the "Pricing Power" logic—leveraging high-turnover bulk channel data to ensure the final trade\_in\_value remains competitive (often doubling peer-to-peer rates).  
* **PayNow Disbursement Payload:**  
* Generate a  **PayNow QR Code Payload**  using the Mister Mobile UEN.  
* Incorporate a unique TransactionReference mapped to the quote\_id for immediate digital disbursement upon physical device handover.

#### 5\. Security, Compliance & Trust Framework

* **CaseTrust Automation:**  The quotes table includes a casetrust\_identifier. Every quote generated must log the fair-trading variables used at the time of creation to an immutable audit log.  
* **ISO 9001/14001 Audit Trail:**  The inspections table requires an audit\_trail field. This must store a serialized string of the inspector’s ID and a timestamped hash of the 100-point check to prevent post-inspection data tampering.  
* **Warranty/Return Logic:**  A background worker or database trigger must automatically flag quotes that pass the 7-day "No Questions" window or the 30-day warranty period, updating the status to ensure zero-friction customer service.

#### 6\. Coding Agent Execution Directive

**Persona** : Senior Full-Stack Architect  **Directive** : Scaffold a Next.js 15 App Router project and Supabase integration for the Mister Mobile AI-Quoter.**Strict Constraints** :

1. Use the SQL schema provided in Section 2; the quotes table MUST reference the inspections table.  
2. **NO PLACEHOLDERS** . Use the exact brand list: Apple, Samsung, Honor, OPPO, Xiaomi, OnePlus, Nothing Phone, Huawei, Google Pixel, Asus, Nokia, Sony, LG, Realme, Vivo.  
3. Use the exact 17 branch locations provided in the seed script.  
4. The assessment.tsx component must handle a multi-step form that populates a JSON object with keys: screen\_status, battery\_percentage, lock\_status, and oem\_verification.  
5. Implement an API route that mocks the PayNow QR generation logic using UEN and Transaction Reference.  
6. Code must support ISO 9001 compliance by including metadata logging in all database transactions.

#### 7\. Phase 1 Milestone Checklist

Milestone,Success Criteria,Mister Mobile Operational Alignment  
Relational Foundation,SQL DDL deployed; quotes successfully verified as dependent on inspections.,"Ensures ""Trust"" by justifying every price quote with a rigorous inspection log."  
100-Steps Data Schema,Assessment UI captures and stores standardized JSONB data for refurbish-costing.,Codifies the proprietary inspection regimen across all 17 branches.  
Pricing Moat API,Edge Function returns values factoring in bulk-channel volatility and parity indices.,"Delivers the ""Pricing Power"" required to outperform fragmented C2C platforms."  
Compliance Automation,Automated 30-day warranty and 7-day return tracking logic active in DB.,Maintains CaseTrust and ISO 9001/14001 accreditation standards.  
Immediate Disbursement,Function generates a valid PayNow payload with UEN and unique transaction reference.,"Facilitates the ""instant payment"" promise for walk-in and online customers."  
