CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "AgentRunStatus" AS ENUM ('PLANNING', 'WAITING_FOR_CONFIRMATION', 'EXECUTING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "ToolExecutionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE "UserApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'EDITED');

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ChatMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentRun" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "status" "AgentRunStatus" NOT NULL DEFAULT 'PLANNING',
  "userInput" TEXT NOT NULL,
  "plan" JSONB NOT NULL,
  "result" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ToolExecution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "agentRunId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB,
  "status" "ToolExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ToolExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserApproval" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "agentRunId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "decision" "UserApprovalDecision" NOT NULL,
  "editedPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserApproval_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");
CREATE INDEX "AgentRun_userId_createdAt_idx" ON "AgentRun"("userId", "createdAt");
CREATE INDEX "AgentRun_conversationId_createdAt_idx" ON "AgentRun"("conversationId", "createdAt");
CREATE INDEX "ToolExecution_agentRunId_createdAt_idx" ON "ToolExecution"("agentRunId", "createdAt");
CREATE INDEX "ToolExecution_userId_createdAt_idx" ON "ToolExecution"("userId", "createdAt");
CREATE INDEX "UserApproval_agentRunId_createdAt_idx" ON "UserApproval"("agentRunId", "createdAt");
CREATE INDEX "UserApproval_userId_createdAt_idx" ON "UserApproval"("userId", "createdAt");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolExecution" ADD CONSTRAINT "ToolExecution_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ToolExecution" ADD CONSTRAINT "ToolExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApproval" ADD CONSTRAINT "UserApproval_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApproval" ADD CONSTRAINT "UserApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
