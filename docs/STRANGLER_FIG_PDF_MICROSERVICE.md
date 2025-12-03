# Strangler Fig Pattern: PDF Generator Microservice Extraction

## Current State Analysis

The PDF Generator (`src/PISystemGen`) is currently embedded within the monolithic API:

- **Location**: `src/PISystemGen/`
- **Components**:
  - `controller.ts` - HTTP endpoints for PDF generation
  - `generator.ts` - Core PDF generation logic
  - `jobManager.ts` - Queue job management
  - `routes.ts` - Route definitions
- **Integration**: Uses BullMQ for async processing, depends on database models

## Phase 1: API Wrapper Creation

### 1.1 Create Communication Interface
```typescript
// src/shared/infra/messaging/pdf-service.interface.ts
export interface PDFServiceInterface {
  generatePDF(data: PDFGenerationRequest): Promise<PDFGenerationResponse>;
  getStatus(jobId: string): Promise<PDFJobStatus>;
}

export interface PDFGenerationRequest {
  template: string;
  data: any;
  options?: PDFOptions;
}

export interface PDFGenerationResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
}
```

### 1.2 Implement EventBus Communication
```typescript
// src/modules/pdf/pdf.service.ts (new wrapper service)
import { EventBus } from '@shared/infra/messaging/event-bus.interface';
import { PDFServiceInterface } from '@shared/infra/messaging/pdf-service.interface';

export class PDFService implements PDFServiceInterface {
  constructor(private eventBus: EventBus) {}

  async generatePDF(request: PDFGenerationRequest): Promise<PDFGenerationResponse> {
    const jobId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.eventBus.publish('pdf.generate', {
      jobId,
      ...request
    });

    return {
      jobId,
      status: 'queued',
      estimatedTime: 30 // seconds
    };
  }

  async getStatus(jobId: string): Promise<PDFJobStatus> {
    // Query status via EventBus or direct HTTP call to microservice
    return this.queryJobStatus(jobId);
  }
}
```

## Phase 2: Microservice Implementation

### 2.1 Standalone PDF Microservice Structure
```
pdf-microservice/
├── src/
│   ├── controllers/
│   │   └── pdf.controller.ts
│   ├── services/
│   │   └── pdf.generator.ts
│   ├── models/
│   │   └── pdf.job.model.ts
│   ├── routes/
│   │   └── pdf.routes.ts
│   ├── config/
│   │   └── database.ts
│   ├── shared/
│   │   ├── logger.ts
│   │   └── error-handler.ts
│   └── app.ts
├── Dockerfile
├── package.json
├── ecosystem.config.js
└── README.md
```

### 2.2 Database Schema for PDF Jobs
```typescript
// pdf-microservice/src/models/pdf.job.model.ts
import mongoose from 'mongoose';

const pdfJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  },
  template: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  options: { type: mongoose.Schema.Types.Mixed },
  resultUrl: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export const PDFJob = mongoose.model('PDFJob', pdfJobSchema);
```

### 2.3 EventBus Integration in Microservice
```typescript
// pdf-microservice/src/app.ts
import { getEventBus } from './shared/event-bus';

const eventBus = getEventBus();

// Subscribe to PDF generation requests
eventBus.subscribe('pdf.generate', async (message) => {
  const { jobId, template, data, options } = message;

  try {
    // Update job status to processing
    await PDFJob.findOneAndUpdate(
      { jobId },
      { status: 'processing', updatedAt: new Date() }
    );

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generate(template, data, options);

    // Upload to storage and get URL
    const resultUrl = await uploadToS3(pdfBuffer, `pdfs/${jobId}.pdf`);

    // Update job as completed
    await PDFJob.findOneAndUpdate(
      { jobId },
      {
        status: 'completed',
        resultUrl,
        completedAt: new Date(),
        updatedAt: new Date()
      }
    );

    // Publish completion event
    await eventBus.publish('pdf.completed', { jobId, resultUrl });

  } catch (error) {
    // Update job as failed
    await PDFJob.findOneAndUpdate(
      { jobId },
      {
        status: 'failed',
        error: error.message,
        updatedAt: new Date()
      }
    );

    // Publish failure event
    await eventBus.publish('pdf.failed', { jobId, error: error.message });
  }
});
```

## Phase 3: Migration Strategy

### 3.1 Feature Toggle Implementation
```typescript
// src/config/features.ts
export const features = {
  pdfMicroservice: process.env.PDF_MICROSERVICE_ENABLED === 'true'
};
```

### 3.2 Dual Implementation in Controller
```typescript
// src/PISystemGen/controller.ts (modified)
import { PDFService } from '@modules/pdf/pdf.service';
import { features } from '@config/features';

export class PISystemGenController {
  constructor(
    private pdfService: PDFService,
    private legacyPDFGenerator: LegacyPDFGenerator
  ) {}

  async generatePDF(req: Request, res: Response) {
    if (features.pdfMicroservice) {
      // Use new microservice
      const result = await this.pdfService.generatePDF(req.body);
      return res.json(result);
    } else {
      // Use legacy implementation
      const pdf = await this.legacyPDFGenerator.generate(req.body);
      return res.send(pdf);
    }
  }
}
```

## Phase 4: Infrastructure Setup

### 4.1 Docker Compose for Development
```yaml
# docker-compose.pdf.yml
version: '3.8'
services:
  pdf-microservice:
    build: ./pdf-microservice
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/pdf_service
      - REDIS_URL=redis://redis:6379
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - mongodb
      - redis
    ports:
      - "4001:4000"
```

### 4.2 Kubernetes Deployment
```yaml
# k8s/pdf-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pdf-microservice
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pdf-microservice
  template:
    spec:
      containers:
      - name: pdf-microservice
        image: your-registry/pdf-microservice:latest
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

## Phase 5: Testing and Rollback

### 5.1 Integration Tests
- Test both implementations return identical results
- Load testing to ensure microservice performance
- Failure scenario testing (microservice down)

### 5.2 Monitoring
- Track PDF generation success/failure rates
- Monitor queue lengths and processing times
- Set up alerts for microservice health

### 5.3 Rollback Plan
- Feature toggle allows instant rollback
- Keep legacy code for 30 days after migration
- Database migration scripts for job data

## Benefits of This Approach

1. **Zero Downtime**: Feature toggle allows seamless switching
2. **Gradual Migration**: Can migrate endpoints one by one
3. **Risk Mitigation**: Easy rollback if issues arise
4. **Scalability**: PDF generation can scale independently
5. **Maintainability**: Separate codebase for PDF concerns
6. **Technology Flexibility**: Can use different tech stack for PDF service

## Timeline Estimate

- **Phase 1**: 1-2 weeks (Interface creation, wrapper service)
- **Phase 2**: 2-3 weeks (Microservice development)
- **Phase 3**: 1 week (Migration logic, feature toggles)
- **Phase 4**: 1 week (Infrastructure setup)
- **Phase 5**: 2 weeks (Testing, monitoring, production deployment)

Total: 7-11 weeks for complete migration