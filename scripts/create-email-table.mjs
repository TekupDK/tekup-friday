import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);

const sql = `
CREATE TABLE IF NOT EXISTS email_messages (
  id int AUTO_INCREMENT NOT NULL,
  userId int NOT NULL,
  threadId int NOT NULL,
  gmailMessageId varchar(255) NOT NULL,
  gmailThreadId varchar(255) NOT NULL,
  \`from\` varchar(500) NOT NULL,
  \`to\` text NOT NULL,
  cc text,
  bcc text,
  subject text,
  bodyText text,
  bodyHtml text,
  snippet text,
  \`date\` timestamp NOT NULL,
  labels json,
  hasAttachment boolean NOT NULL DEFAULT false,
  isRead boolean NOT NULL DEFAULT false,
  isStarred boolean NOT NULL DEFAULT false,
  internalDate timestamp,
  createdAt timestamp NOT NULL DEFAULT (now()),
  updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT email_messages_id PRIMARY KEY(id),
  CONSTRAINT email_messages_gmailMessageId_unique UNIQUE(gmailMessageId)
)
`;

console.log("Creating email_messages table...");
await db.execute(sql);
console.log("✅ Table created successfully!");
process.exit(0);
