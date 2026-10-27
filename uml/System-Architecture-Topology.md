# UniSport Eindhoven — System Architecture & Topology

## 1. Visual Diagram (Mermaid — Auto-Rendered on GitHub)

```mermaid
flowchart TB
  subgraph Client["Client Tier (Browser / Mobile PWA)"]
    direction TB

    subgraph UI["Presentation Layer (UI Views)"]
      V_AUTH["Campus Auth View<br/>(Login & Registration)"]
      V_FEED["Discovery Feed & Filters"]
      V_SPOTS["My Spots & Roster Modal"]
      V_SOCIAL["Student Directory & Notifications"]
    end

    subgraph Logic["Application Logic Layer (Client Engine - app.js)"]
      L_AUTH["Auth & Campus Domain Guard<br/>(Fontys & TU/e Validation)"]
      L_SESSION["Session & Roster Controller<br/>(Host Edit, Kick, Auto-Cancel, Amsterdam Time)"]
      L_FILTER["Geo & Filter Engine<br/>(Distance, Sport, University, Price, Date)"]
      L_SYNC["Real-Time State & Cache Manager"]
    end

    CACHE[("Browser LocalStorage<br/>(Offline Cache & Session State)")]

    UI <--> Logic
    L_SYNC <--> CACHE
  end

  subgraph Edge["Delivery Tier"]
    CDN["Vercel Edge CDN<br/>(Static SPA Hosting over HTTPS)"]
  end

  subgraph Cloud["Backend Tier (Google Firebase BaaS)"]
    direction TB
    FB_AUTH["Firebase Authentication<br/>(JWT Identity Provider)"]
    RULES["Firestore Security Rules<br/>(Role & Ownership Access Control)"]

    subgraph DB["Cloud Firestore (Real-Time NoSQL Database)"]
      C_USERS[("users<br/>(Profiles, University, Avatar)")]
      C_ACTS[("activities<br/>(Sessions, Roster, Duration, Price)")]
      C_FRIENDS[("friend_requests<br/>(Student Connections)")]
      C_NOTIFS[("notifications<br/>(Joins, Kicks, Cancellations)")]
    end

    RULES --> DB
  end

  CDN -->|"Delivers SPA Assets (HTTPS)"| Client
  L_AUTH <-->|"Auth & Token Verification (HTTPS)"| FB_AUTH
  L_SYNC <-->|"Real-Time Streams (WSS onSnapshot) & CRUD"| RULES
```

---

## 2. PlantUML Source Code (`.puml`)

```plantuml
@startuml UniSport_System_Architecture_Topology
skinparam componentStyle rectangle
skinparam Shadowing false
skinparam packageStyle rectangle

package "Delivery Tier" {
  [Vercel Edge CDN\n(HTTPS Static SPA Hosting)] as CDN
}

package "Client Tier (Desktop Browser / Mobile PWA)" {

  package "Presentation Layer (UI Views)" {
    [Campus Auth View] as UIAuth
    [Session Feed & Filter Drawer] as UIFeed
    [My Spots & Roster Manager] as UISpots
    [Student Directory & Notifications] as UISocial
  }

  package "Application Logic Layer (UniSport Client Engine)" {
    [Auth & University Domain Guard\n(@student.fontys.nl / @student.tue.nl)] as LogicAuth
    [Session Lifecycle & Roster Controller\n(Amsterdam Time, Host Edit, Kick, Auto-Cancel)] as LogicSession
    [Geo & Multi-Filter Engine\n(Distance, Sport, Uni, Date, Price)] as LogicFilter
    [Real-Time Sync & State Manager] as LogicSync
  }

  database "Browser LocalStorage\n(Offline Cache & Active Session)" as LocalCache
}

package "Backend Tier (Google Firebase BaaS)" {
  [Firebase Authentication\n(JWT Identity Service)] as FBAuth
  [Firestore Security Rules\n(Ownership & Campus Access Control)] as SecRules

  database "Cloud Firestore (Real-Time NoSQL)" as Firestore {
    [users\n(Profile, University, Sport, Avatar)] as ColUsers
    [activities\n(Session, Host, Roster, Duration, Price)] as ColActs
    [friend_requests\n(Peer Connections)] as ColFriends
    [notifications\n(Joins, Kicks, Cancellations)] as ColNotifs
  }
}

CDN --> UIAuth : "Serves SPA Bundle (HTTPS)"

UIAuth <--> LogicAuth
UIFeed <--> LogicFilter
UISpots <--> LogicSession
UISocial <--> LogicSync

LogicSession --> LogicSync
LogicFilter --> LogicSync
LogicSync <--> LocalCache : "Hydration & Offline Fallback"

LogicAuth <--> FBAuth : "Verify Credentials & JWT (HTTPS)"
LogicSync <--> SecRules : "Real-Time WebSocket (onSnapshot)\n& Document Mutations"

SecRules --> ColUsers
SecRules --> ColActs
SecRules --> ColFriends
SecRules --> ColNotifs

@enduml
```
