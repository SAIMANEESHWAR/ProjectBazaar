# Project Bazaar – User Flow

View this file in VS Code (with a Mermaid extension), on GitHub, or paste the code block into [Mermaid Live Editor](https://mermaid.live) to export as PNG/SVG.

```mermaid
flowchart TB
    subgraph entry[" "]
        A[Landing / Home]
        B[Login / Signup]
        A --> B
    end

    B --> C{User Role?}

    subgraph buyer["Buyer Flow"]
        D[Dashboard]
        E[Browse Projects]
        F[View Project / Cart / Wishlist]
        G[Purchase or Place Bid]
        H[Access Content / Chat]
        D --> E --> F --> G --> H
    end

    subgraph freelancer["Freelancer & Career"]
        I[Freelancer Directory]
        J[View Profile → Chat / Hire]
        K[Build Portfolio]
        L[AI Resume Builder]
        M[Mock Assessment]
        N[Coding Questions]
        O[Hackathons & Courses]
        I --> J
        D -.-> K
        D -.-> L
        D -.-> M
        D -.-> N
        D -.-> O
    end

    subgraph seller["Seller Flow"]
        P[Seller Dashboard]
        Q[Post Project / Bid Request]
        R[My Projects]
        S[Orders & Bids]
        T[Earnings]
        U[Payouts]
        P --> Q --> R --> S --> T --> U
    end

    subgraph admin["Admin"]
        V[Admin Dashboard]
        W[Users · Moderation · Analytics]
        V --> W
    end

    C --> D
    C --> P
    C --> V
```

## Summary

| Role   | Main path |
|--------|-----------|
| **Buyer** | Home → Auth → Dashboard → Browse projects / Freelancers / Career tools → Purchase, bid, or hire |
| **Seller** | Home → Auth → Seller Dashboard → Post project or bid request → Manage projects → Earnings → Payouts |
| **Admin**  | Home → Auth → Admin Dashboard → Users, moderation, analytics |

To export as image: copy the contents of the `flowchart TB` block (from `flowchart TB` to the last `end`) into [mermaid.live](https://mermaid.live), then use **Actions → Export** (PNG or SVG).
