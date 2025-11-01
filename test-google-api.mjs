import { searchGmailThreads, listCalendarEvents } from './server/google-api.ts';

console.log('Testing Google API integration...\n');

// Test Gmail
console.log('1. Testing Gmail API...');
try {
  const emails = await searchGmailThreads({ query: 'from:info@rendetalje.dk', maxResults: 5 });
  console.log(`✅ Gmail API works! Found ${emails.length} threads`);
  if (emails.length > 0) {
    console.log(`   First thread: ${emails[0].subject}`);
  }
} catch (error) {
  console.error('❌ Gmail API failed:', error.message);
}

// Test Calendar
console.log('\n2. Testing Calendar API...');
try {
  const events = await listCalendarEvents({ 
    timeMin: new Date('2025-01-01'),
    timeMax: new Date('2025-12-31'),
    maxResults: 5
  });
  console.log(`✅ Calendar API works! Found ${events.length} events`);
  if (events.length > 0) {
    console.log(`   First event: ${events[0].summary}`);
  }
} catch (error) {
  console.error('❌ Calendar API failed:', error.message);
}

console.log('\n✅ Google API integration test complete!');
