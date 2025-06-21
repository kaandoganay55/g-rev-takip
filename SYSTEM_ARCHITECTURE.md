# 🏗️ TASK TRACKER - SİSTEM MİMARİSİ DETAYLI AÇIKLAMA

## 📋 İÇİNDEKİLER
1. [Genel Mimari](#genel-mimari)
2. [Frontend Katmanı](#frontend-katmanı)
3. [Backend Katmanı](#backend-katmanı)
4. [Veritabanı Katmanı](#veritabanı-katmanı)
5. [API İletişimi](#api-iletişimi)
6. [State Yönetimi](#state-yönetimi)
7. [Güvenlik](#güvenlik)
8. [AI Entegrasyonu](#ai-entegrasyonu)

---

## 🏗️ GENEL MİMARİ

```
┌─────────────────────────────────────────────────────────────┐
│                    KULLANICI (Browser)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/HTTPS İstekleri
                      │ WebSocket (Real-time)
┌─────────────────────▼───────────────────────────────────────┐
│                  FRONTEND KATMANI                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Next.js   │ │   React     │ │     Tailwind CSS        ││
│  │   App Router│ │   Components│ │     + shadcn/ui         ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Hooks     │ │   Context   │ │     State Management    ││
│  │   (Custom)  │ │   (React)   │ │     (useState/useEffect)││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │ API Calls (fetch)
                      │ JSON Data Exchange
┌─────────────────────▼───────────────────────────────────────┐
│                   BACKEND KATMANI                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Next.js   │ │   API       │ │     Authentication      ││
│  │   API Routes│ │   Handlers  │ │     (NextAuth.js)       ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Business  │ │   AI        │ │     Notifications       ││
│  │   Logic     │ │   Integration│ │     Service             ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │ Database Queries
                      │ External API Calls
┌─────────────────────▼───────────────────────────────────────┐
│                 HARICI SERVİSLER                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   MongoDB   │ │   OpenAI    │ │     Google OAuth        ││
│  │   Atlas     │ │   API       │ │     Authentication      ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 FRONTEND KATMANI

### 📁 Dizin Yapısı
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── page.tsx           # Ana sayfa (Task Manager)
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global CSS
│   ├── auth/              # Authentication sayfaları
│   │   ├── signin/
│   │   └── signup/
│   └── tools/             # Araçlar sayfası
│       └── page.tsx
├── components/            # UI Bileşenleri
│   ├── ui/               # shadcn/ui bileşenleri
│   ├── Navbar.tsx        # Navigation
│   ├── Footer.tsx        # Footer
│   ├── TodayTasks.tsx    # Bugünün görevleri
│   ├── CalendarView.tsx  # Takvim görünümü
│   └── NotificationCenter.tsx # Bildirim merkezi
├── hooks/                # Custom React Hooks
│   └── useNotifications.ts
├── contexts/             # React Context
│   └── SocketContext.tsx
└── lib/                  # Utility fonksiyonları
    ├── authOptions.ts    # NextAuth config
    ├── mongodb.ts        # DB connection
    ├── openai.ts         # AI integration
    └── utils.ts          # Helper functions
```

### 🔄 State Yönetimi Pattern
```typescript
// 1. Local Component State (useState)
const [tasks, setTasks] = useState<Task[]>([]);
const [loading, setLoading] = useState(false);

// 2. Side Effects (useEffect)
useEffect(() => {
  if (session) {
    fetchTasks(); // API call
  }
}, [session]); // Dependency array

// 3. Event Handlers
const handleInputChange = (e: ChangeEvent) => {
  const { name, value } = e.target;
  setNewTask(prev => ({ ...prev, [name]: value }));
};

// 4. API Communication
const fetchTasks = async () => {
  const response = await fetch('/api/tasks');
  const data = await response.json();
  setTasks(data); // State update triggers re-render
};
```

---

## 🔧 BACKEND KATMANI

### 🛣️ API Routes Yapısı
```
src/app/api/
├── auth/                  # Authentication
│   ├── [...nextauth]/     # NextAuth.js handler
│   │   └── route.ts       # OAuth + Credentials
│   └── register/          # User registration
│       └── route.ts
├── tasks/                 # Task Management
│   ├── route.ts          # CRUD operations
│   └── complete/         # Task completion
│       └── route.ts
├── ai/                   # AI Integration
│   ├── suggestions/      # Task suggestions
│   │   └── route.ts
│   ├── description/      # Description generation
│   │   └── route.ts
│   └── priority/         # Priority analysis
│       └── route.ts
├── notifications/        # Notification System
│   └── route.ts
├── users/               # User Management
│   └── profile/
│       └── route.ts
└── socket/              # Real-time (WebSocket)
    └── route.ts
```

### 🔐 API Handler Pattern
```typescript
// API Route Handler Example
export async function POST(request: NextRequest) {
  try {
    // 1. Session Validation
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // 2. Request Validation
    const body = await request.json();
    const { title, description } = body;
    
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title required' }, 
        { status: 400 }
      );
    }

    // 3. Database Operation
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('tasks');
    
    const result = await collection.insertOne({
      title,
      description,
      userId: session.user.email,
      createdAt: new Date()
    });

    // 4. Response
    return NextResponse.json(
      { _id: result.insertedId, title, description },
      { status: 201 }
    );
    
  } catch (error) {
    // 5. Error Handling
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 💾 VERİTABANI KATMANI

### 🗃️ MongoDB Collections
```javascript
// Users Collection
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  image: String,
  createdAt: Date,
  updatedAt: Date
}

// Tasks Collection
{
  _id: ObjectId,
  title: String (required),
  description: String,
  userId: String (email - foreign key),
  priority: String ('düşük'|'orta'|'yüksek'|'acil'),
  category: String,
  completed: Boolean (default: false),
  deadline: Date,
  createdAt: Date,
  completedAt: Date,
  updatedAt: Date
}

// Notifications Collection
{
  _id: ObjectId,
  type: String ('task_added'|'task_completed'|'deadline_warning'),
  title: String,
  message: String,
  userId: String (email),
  read: Boolean (default: false),
  data: Object, // Extra data
  createdAt: Date
}
```

### 🔍 Database Queries
```typescript
// MongoDB Connection Pattern
const client = await clientPromise;
const db = client.db(); // Uses default DB from connection string
const tasksCollection = db.collection('tasks');

// READ - Get user's tasks
const tasks = await tasksCollection
  .find({ userId: session.user.email })
  .sort({ createdAt: -1 })
  .toArray();

// CREATE - Add new task
const result = await tasksCollection.insertOne({
  title: 'New Task',
  userId: session.user.email,
  createdAt: new Date()
});

// UPDATE - Mark as completed
await tasksCollection.updateOne(
  { _id: new ObjectId(taskId) },
  { 
    $set: { 
      completed: true, 
      completedAt: new Date() 
    } 
  }
);

// DELETE - Remove task
await tasksCollection.deleteOne({
  _id: new ObjectId(taskId),
  userId: session.user.email // Security check
});
```

---

## 🔄 API İLETİŞİMİ

### 📡 Request/Response Flow
```
┌─────────────┐    1. User Action     ┌─────────────────┐
│   Frontend  │ ───────────────────► │   React State   │
│   Component │                      │   Update        │
└─────────────┘                      └─────────────────┘
       │                                       │
       │ 2. API Call                          │ 6. Re-render
       ▼                                       ▼
┌─────────────┐    3. HTTP Request    ┌─────────────────┐
│   fetch()   │ ───────────────────► │   API Route     │
│   Function  │                      │   Handler       │
└─────────────┘                      └─────────────────┘
       ▲                                       │
       │ 5. JSON Response                     │ 4. DB Query
       │                                       ▼
┌─────────────┐                      ┌─────────────────┐
│   State     │ ◄─────────────────── │   MongoDB       │
│   Update    │                      │   Operation     │
└─────────────┘                      └─────────────────┘
```

### 🔧 API Call Examples
```typescript
// 1. GET Request - Fetch Tasks
const fetchTasks = async () => {
  const response = await fetch('/api/tasks', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
};

// 2. POST Request - Create Task
const createTask = async (taskData) => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  
  return response.json();
};

// 3. PUT Request - Update Task
const updateTask = async (taskId, updates) => {
  const response = await fetch('/api/tasks', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: taskId, ...updates })
  });
  
  return response.json();
};

// 4. DELETE Request - Remove Task
const deleteTask = async (taskId) => {
  const response = await fetch(`/api/tasks?id=${taskId}`, {
    method: 'DELETE'
  });
  
  return response.json();
};
```

---

## 🧠 STATE YÖNETİMİ

### 📊 React State Pattern
```typescript
// Component State Structure
interface ComponentState {
  // Data States
  tasks: Task[];              // Ana veri
  newTask: TaskForm;          // Form verileri
  
  // UI States  
  loading: boolean;           // Yükleme durumu
  error: string;              // Hata mesajları
  activeTab: TabType;         // UI kontrolü
  
  // AI States
  aiSuggestions: string[];    // AI önerileri
  aiLoading: boolean;         // AI yükleme
  showSuggestions: boolean;   // UI kontrolü
  
  // Modal States
  showQuestionFlow: boolean;  // Modal kontrolü
  currentStep: number;        // Adım takibi
  answers: Record<string, string>; // Form cevapları
}

// State Update Patterns
const updateTasksAfterCreate = (newTask: Task) => {
  setTasks(prevTasks => [...prevTasks, newTask]); // Immutable update
};

const updateTaskCompletion = (taskId: string) => {
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task._id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    )
  );
};
```

### 🔄 Side Effects (useEffect)
```typescript
// 1. Component Mount - Data Loading
useEffect(() => {
  if (session) {
    fetchTasks(); // API call on mount
  }
}, [session]); // Dependency: session

// 2. Authentication Check
useEffect(() => {
  if (status === 'loading') return;
  if (!session) {
    redirect('/auth/signin'); // Redirect if not authenticated
  }
}, [session, status]);

// 3. Real-time Updates (Polling)
useEffect(() => {
  if (!session) return;
  
  const interval = setInterval(() => {
    fetchNotifications(); // Polling every 30 seconds
  }, 30000);
  
  return () => clearInterval(interval); // Cleanup
}, [session]);
```

---

## 🔐 GÜVENLİK

### 🛡️ Authentication Flow
```
1. User Login
   ├── Email/Password → Credentials Provider
   ├── Google OAuth → Google Provider
   └── Session Creation → JWT Token

2. Session Management
   ├── JWT Token → Browser Cookie
   ├── Server-side Validation → getServerSession()
   └── Auto Refresh → NextAuth.js

3. API Protection
   ├── Session Check → Every API Route
   ├── User Authorization → Resource Access
   └── Data Isolation → User-specific Queries
```

### 🔒 Security Measures
```typescript
// 1. API Route Protection
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... API logic
}

// 2. Data Isolation
const tasks = await tasksCollection.find({ 
  userId: session.user.email // Only user's data
}).toArray();

// 3. Input Validation
const { title, description } = await request.json();
if (!title?.trim() || title.length > 100) {
  return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
}

// 4. SQL Injection Prevention (MongoDB)
const taskId = request.nextUrl.searchParams.get('id');
if (!ObjectId.isValid(taskId)) {
  return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
}
```

---

## 🤖 AI ENTEGRASYONU

### 🧠 OpenAI Integration Flow
```
Frontend Input → Backend API → OpenAI API → Response Processing → Frontend Display

1. User Input: "ev temizliği"
2. Frontend: POST /api/ai/suggestions
3. Backend: OpenAI GPT-3.5-turbo call
4. AI Response: ["Mutfağı temizle", "Banyo temizle", ...]
5. Backend: Process & validate response
6. Frontend: Display suggestions
7. User: Select suggestion → Create task
```

### 🔧 AI Service Pattern
```typescript
// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI Prompt Engineering
const generateSuggestions = async (userInput: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Sen bir görev yönetimi asistanısın..."
      },
      {
        role: "user",
        content: `"${userInput}" konusunda görev önerileri ver.`
      }
    ],
    max_tokens: 300,
    temperature: 0.7
  });
  
  return processAIResponse(response);
};

// Response Processing
const processAIResponse = (response) => {
  return response.choices[0]?.message?.content
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[-•\d.]\s*/, '').trim())
    .slice(0, 5);
};
```

---

## 📊 PERFORMANS VE OPTİMİZASYON

### ⚡ Frontend Optimizations
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **CSS-in-JS**: Tailwind CSS for minimal bundle size
- **React Optimizations**: useMemo, useCallback for expensive operations

### 🚀 Backend Optimizations
- **Database Indexing**: Email-based user queries
- **API Caching**: Static responses caching
- **Connection Pooling**: MongoDB connection reuse
- **Error Boundaries**: Graceful error handling

### 📈 Monitoring
- **Console Logging**: Development debugging
- **Error Tracking**: Try-catch blocks in all async operations
- **Performance Metrics**: API response times
- **User Analytics**: Usage patterns tracking

---

## 🔮 GELECEK GELİŞTİRMELER

### 🌟 Planned Features
1. **Real-time Collaboration**: WebSocket implementation
2. **Mobile App**: React Native version
3. **Advanced AI**: ML model training with user data
4. **Analytics Dashboard**: Detailed productivity metrics
5. **Team Management**: Multi-user workspaces
6. **Integrations**: Google Calendar, Slack, Trello
7. **Offline Support**: PWA with offline capabilities
8. **Performance Optimization**: Redis caching, CDN

Bu dokümantasyon, Task Tracker projesinin tüm teknik detaylarını kapsamaktadır ve geliştiricilerin sistemi anlaması için rehber niteliğindedir. 