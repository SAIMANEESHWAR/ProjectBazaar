# Project Bazaar Total Ecosystem

This section captures the "Bigger Perspective" — how the different modules of Project Bazaar (Marketplace, Learning, Growth, and Freelancing) intersect to create an end-to-end professional lifecycle.

## The Holistic Platform Journey

![Project Bazaar Total Journey Infographic](/Users/m.sharan/.gemini/antigravity/brain/f106251f-f357-41a3-9b2f-76dcb0f15a3e/project_bazaar_big_perspective_flow_1772223126536.png)

```mermaid
flowchart TD
    %% Node Definitions
    Auth([<b>Authentication Hub</b>]):::startClass
    
    subgraph LearningGrowth ["<b>1. LEARNING & GROWTH</b>"]
        Learn[Courses & Hackathons]:::processClass
        Assess[Mock Assessments & Coding Qs]:::processClass
        Verify{Skill<br/>Verified?}:::decisionClass
    end
    
    subgraph ProfessionalTools ["<b>2. PROFESSIONAL TOOLS</b>"]
        Builder[AI Resume Builder]:::processClass
        Portfolio[Portfolio Generator]:::processClass
        Online([<b>Live Professional Profile</b>]):::startClass
    end
    
    subgraph MarketInteractions ["<b>3. MARKETPLACE & FREELANCING</b>"]
        Market[Browse/Buy Projects]:::processClass
        Freelance[Bid on Projects / Seller Hub]:::processClass
        Match{Buyer/Seller<br/>Match?}:::decisionClass
        Chat[Chat & Negotiation]:::processClass
    end
    
    subgraph TransactionLoop ["<b>4. TRANSACTION & SUCCESS</b>"]
        Pay[Secure Payment - Razorpay]:::processClass
        Delivery[Asset Delivery & Access]:::processClass
        Analytics[Earnings & Progress Stats]:::processClass
    end

    %% Global Connections
    Auth --> Learn
    Auth --> Market
    
    Learn --> Assess
    Assess --> Verify
    Verify -- "Yes" --> Builder
    
    Builder --> Portfolio
    Portfolio --> Online
    
    Online -- "Boosts Rank" --> Freelance
    
    Market --> Match
    Freelance --> Match
    
    Match -- "Yes" --> Chat
    Chat --> Pay
    Pay --> Delivery
    Delivery --> Analytics
    Analytics -- "Feedback Loop" --> Learn

    %% Styles
    classDef startClass fill:#448AFF,stroke:#2962FF,color:white,stroke-width:2px;
    classDef processClass fill:#FF5722,stroke:#E64A19,color:white,rx:10,ry:10;
    classDef decisionClass fill:#212121,stroke:#000000,color:white;
    classDef endClass fill:#757575,stroke:#424242,color:white,rx:10,ry:10;
```

---

# Detailed User Flows

## High-Level Visual Flow
![Project Bazaar User Flow Chart](/Users/m.sharan/.gemini/antigravity/brain/f106251f-f357-41a3-9b2f-76dcb0f15a3e/project_bazaar_user_flow_diagram_1772223010127.png)

## 1. Authentication & Onboarding Flow

```mermaid
flowchart TD
    %% Node Definitions
    Start([<b>START</b>]):::startClass
    Login[Login Page: User enters credentials]:::processClass
    Correct{Login info<br/>correct?}:::decisionClass
    
    Reset[Password Reset: User enters email]:::processClass
    EmailMatch{Email matches<br/>record?}:::decisionClass
    
    ViewDash[View Dashboard Details]:::processClass
    Register[Registration Page]:::endClass
    
    NewPass[Enter New Password]:::processClass
    Confirm[Confirmation]:::processClass
    Dashboard([<b>DASHBOARD</b>]):::startClass

    %% Connections
    Start --> Login
    Login --> Correct
    
    Correct -- "<b>No</b>" --> Reset
    Correct -- "<b>Yes</b>" --> ViewDash
    
    Reset --> EmailMatch
    EmailMatch -- "<b>No</b>" --> Register
    EmailMatch -- "<b>Yes</b>" --> NewPass
    
    NewPass --> Confirm
    Confirm -- "<b>Yes</b>" --> Login
    
    ViewDash --> Dashboard

    %% Styles
    classDef startClass fill:#448AFF,stroke:#2962FF,color:white,stroke-width:2px;
    classDef processClass fill:#FF5722,stroke:#E64A19,color:white,rx:10,ry:10;
    classDef decisionClass fill:#212121,stroke:#000000,color:white;
    classDef endClass fill:#757575,stroke:#424242,color:white,rx:10,ry:10;
```

## 2. Buyer Purchase Journey

```mermaid
flowchart TD
    Start([<b>START</b>]):::startClass
    Browse[Browse Marketplace]:::processClass
    Interested{Interested in<br/>Project?}:::decisionClass
    
    Contact[Chat with Seller]:::processClass
    AddToCart[Add to Cart]:::processClass
    Checkout[Pay via Razorpay]:::processClass
    
    PaymentOk{Payment<br/>Successful?}:::decisionClass
    Retry[Select Different Amount/Method]:::processClass
    
    Access([<b>ACCESS CONTENT</b>]):::startClass

    %% Connections
    Start --> Browse
    Browse --> Interested
    
    Interested -- "<b>Chat</b>" --> Contact
    Contact --> AddToCart
    Interested -- "<b>Instant</b>" --> AddToCart
    
    AddToCart --> Checkout
    Checkout --> PaymentOk
    
    PaymentOk -- "<b>No</b>" --> Retry
    Retry --> Checkout
    
    PaymentOk -- "<b>Yes</b>" --> Access

    %% Styles
    classDef startClass fill:#448AFF,stroke:#2962FF,color:white,stroke-width:2px;
    classDef processClass fill:#FF5722,stroke:#E64A19,color:white,rx:10,ry:10;
    classDef decisionClass fill:#212121,stroke:#000000,color:white;
    classDef endClass fill:#757575,stroke:#424242,color:white,rx:10,ry:10;
```

## 3. Freelancer / Seller Journey

```mermaid
flowchart TD
    Start([<b>START</b>]):::startClass
    Profile[Complete Freelancer Profile]:::processClass
    Upload[Upload Project Assets]:::processClass
    Review{Admin<br/>Approval?}:::decisionClass
    
    Fix[Amend Details]:::processClass
    Live([<b>PROJECT LIVE</b>]):::startClass
    Earnings[Track Sales & Payouts]:::processClass

    %% Connections
    Start --> Profile
    Profile --> Upload
    Upload --> Review
    
    Review -- "<b>Rejected</b>" --> Fix
    Fix --> Upload
    
    Review -- "<b>Approved</b>" --> Live
    Live --> Earnings

    %% Styles
    classDef startClass fill:#448AFF,stroke:#2962FF,color:white,stroke-width:2px;
    classDef processClass fill:#FF5722,stroke:#E64A19,color:white,rx:10,ry:10;
    classDef decisionClass fill:#212121,stroke:#000000,color:white;
    classDef endClass fill:#757575,stroke:#424242,color:white,rx:10,ry:10;
```
