import fs from 'fs';

let content = fs.readFileSync('src/utils/mockEmail.ts', 'utf8');

// 1. Replace buildAutosaveEmailHtml
const autosaveStart = content.indexOf('function buildAutosaveEmailHtml(');
const autosaveEnd = content.indexOf('\nfunction buildReceiptEmailHtml(');

const newAutosave = `function buildAutosaveEmailHtml(
  payload: ReturnType<typeof getApplicationEmailPayload>,
) {
  const fullName = escapeHtml(
    getDisplayName(payload.firstName, payload.lastName),
  );
  const saveDate = new Date();
  const purgeDate = addDays(saveDate, 9);

  return getBaseEmailHtml({
    title: "Your insurance application is being saved",
    bodyHtml: \`
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear \${fullName},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Your insurance application through <strong>\${escapeHtml(
          payload.associationName,
        )}</strong> has been automatically saved so you don\u2019t lose your progress.
      </p>

      <p style="margin:0 0 28px; font-size:16px; line-height:1.55;">
        You can return to complete your application within the next <strong>10 calendar days.</strong>
      </p>

      \${getButtonHtml("Continue my application", payload.resumeUrl)}

      <p style="margin:0 0 10px; color:#374151; font-size:15px; line-height:1.5;">
        Or copy and paste this website address into your browser:
      </p>

      <p style="margin:0 0 28px; font-size:15px; line-height:1.5; color:#006fff; word-break:break-all;">
        <a href="\${escapeHtml(payload.resumeUrl)}" style="color:#006fff; text-decoration:none;">
          \${escapeHtml(payload.resumeUrl)}
        </a>
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55;">
        We look forward to serving your insurance needs.
      </p>

      \${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      \${getNoticeHtml(
        "Your application will be saved for 10 days.",
        \`For your security, your saved application will be deleted on \${formatMockDate(purgeDate)} . After that, you\u2019ll need to begin a new application.\`,
      )}
      \${getNoReplyHtml()}
    \`,
  });
}
`;

content = content.slice(0, autosaveStart) + newAutosave + content.slice(autosaveEnd + 1);

// 2. Replace buildReceiptEmailHtml
const receiptStart = content.indexOf('function buildReceiptEmailHtml(');
const receiptEnd = content.indexOf('\nfunction buildResumeMagicLinkEmailHtml(');

const newReceipt = `function buildReceiptEmailHtml(
  payload: ReturnType<typeof getApplicationEmailPayload>,
  confirmationNumber: string,
) {
  const fullName = escapeHtml(
    getDisplayName(payload.firstName, payload.lastName),
  );

  return getBaseEmailHtml({
    title: "Thank you! We\u2019ve received your insurance request",
    bodyHtml: \`
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear \${fullName},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        We wanted to let you know we have received your application for <strong>\${escapeHtml(
          payload.clientAcronym,
        )}</strong> sponsored insurance and are processing it now.
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you have any questions, please use the contact information below and refer to your confirmation number: <strong>\${escapeHtml(confirmationNumber)}</strong>
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Thank you.
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55; font-weight:600;">
        \${escapeHtml(payload.clientAcronym)} Group Sponsored Insurance Program, Insurance Administrator
      </p>

      \${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      \${getNoReplyHtml()}
    \`,
  });
}
`;

content = content.slice(0, receiptStart) + newReceipt + content.slice(receiptEnd + 1);

// 3. Replace buildResumeMagicLinkEmailHtml
const magicLinkStart = content.indexOf('function buildResumeMagicLinkEmailHtml(');
const magicLinkEnd = content.indexOf('\nfunction buildPendingReminderEmailHtml(');

const newMagicLink = `function buildResumeMagicLinkEmailHtml() {
  const payload = getClientEmailPayload();

  return getBaseEmailHtml({
    title: "Your requested link to continue your application",
    bodyHtml: \`
      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        A request has been made to return to an insurance application in progress through <strong>\${escapeHtml(
          payload.associationName,
        )}</strong>. Click the link below to continue to your application.
      </p>

      \${getButtonHtml("Confirm my email", payload.resumeMagicLinkUrl)}

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        This link will expire in <strong>10 minutes.</strong>
      </p>

      <p style="margin:0 0 8px; font-size:16px; line-height:1.55; font-weight:700;">
        Didn\u2019t request a link?
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you did not request a link, you may ignore this message. Access to application information will only be granted with verification.
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Questions about access to the insurance application? Email us and we will reply as soon as possible.
      </p>

      \${getNoReplyHtml()}
    \`,
  });
}
`;

content = content.slice(0, magicLinkStart) + newMagicLink + content.slice(magicLinkEnd + 1);

// 4. Replace buildPendingReminderEmailHtml (Autosave Reminder Day 3,7,9)
const pendingStart = content.indexOf('function buildPendingReminderEmailHtml(');
const pendingEnd = content.indexOf('\nfunction buildPurgeReminderEmailHtml(');

const newPending = `function buildPendingReminderEmailHtml() {
  const payload = getClientEmailPayload();
  const startDate = new Date();
  const purgeDate = addDays(startDate, 9);

  return getBaseEmailHtml({
    title: "Your insurance application is ready to be completed",
    bodyHtml: \`
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear \${escapeHtml(MOCK_APPLICANT_FIRST_NAME)},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        We noticed you haven\u2019t finished your <strong>\${escapeHtml(
          payload.associationName,
        )}</strong> insurance application. Good news\u2014your progress has been saved.
      </p>

      \${getButtonHtml("Continue my application", payload.resumeUrl)}

      <p style="margin:0 0 10px; color:#374151; font-size:15px; line-height:1.5;">
        Or copy and paste this website address into your browser:
      </p>

      <p style="margin:0 0 28px; font-size:15px; line-height:1.5; color:#006fff; word-break:break-all;">
        <a href="\${escapeHtml(payload.resumeUrl)}" style="color:#006fff; text-decoration:none;">
          \${escapeHtml(payload.resumeUrl)}
        </a>
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55;">
        We look forward to serving your insurance needs.
      </p>

      \${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      \${getNoticeHtml(
        "Your application will be saved for 10 days.",
        \`For your security, your saved application will be deleted on \${formatMockDate(
          purgeDate,
        )} . After that, you\u2019ll need to begin a new application.\`,
      )}
      \${getNoReplyHtml()}
    \`,
  });
}
`;

content = content.slice(0, pendingStart) + newPending + content.slice(pendingEnd + 1);

// 5. Replace buildPurgeReminderEmailHtml (Deletion Day 10)
const purgeStart = content.indexOf('function buildPurgeReminderEmailHtml(');
const purgeEnd = content.indexOf('\nfunction buildAdvisorEmailHtml(');

const newPurge = `function buildPurgeReminderEmailHtml() {
  const payload = getClientEmailPayload();
  const startDate = new Date();
  const purgeDate = addDays(startDate, 9);

  return getBaseEmailHtml({
    title: "Your insurance application progress",
    bodyHtml: \`
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear \${escapeHtml(MOCK_APPLICANT_FIRST_NAME)},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Your insurance application through <strong>\${escapeHtml(
          payload.associationName,
        )}</strong> has expired and has been securely deleted in accordance with our data retention policy. Application data is saved for you for 10 days to complete until it is deleted.
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you\u2019d still like to apply, you can start a new application.
      </p>

      \${getButtonHtml("Start my application", payload.startUrl)}

      <p style="margin:0 0 10px; color:#374151; font-size:15px; line-height:1.5;">
        Or copy and paste this website address into your browser:
      </p>

      <p style="margin:0 0 28px; font-size:15px; line-height:1.5; color:#006fff; word-break:break-all;">
        <a href="\${escapeHtml(payload.startUrl)}" style="color:#006fff; text-decoration:none;">
          \${escapeHtml(payload.startUrl)}
        </a>
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you have questions about your insurance options, we\u2019re happy to help and provide additional information.
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55;">
        We look forward to serving your insurance needs.
      </p>

      \${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      \${getNoticeHtml(
        "Your application will be saved for 10 days.",
        \`For your security, your saved application will be deleted on \${formatMockDate(
          purgeDate,
        )} . After that, you\u2019ll need to begin a new application.\`,
      )}

      <div style="margin:20px 0; border-top:1px dashed #d1d5db;"></div>

      \${getNoReplyHtml()}
    \`,
  });
}
`;

content = content.slice(0, purgeStart) + newPurge + content.slice(purgeEnd + 1);

// 6. Update subject lines in getAlwaysVisibleMockEmails
content = content.replace(
  'subject: "[DO NOT REPLY] Your saved insurance application"',
  'subject: "[DO NOT REPLY] Your insurance application is being saved"'
);
content = content.replace(
  'subject:\n        "[DO NOT REPLY] Confirm your email to continue your insurance application"',
  'subject:\n        "[DO NOT REPLY] Your requested link to continue your application"'
);
content = content.replace(
  `subject:
        "[DO NOT REPLY] Confirm your email to continue your insurance application"`,
  `subject:
        "[DO NOT REPLY] Your requested link to continue your application"`
);
content = content.replace(
  'subject:\n        "[DO NOT REPLY] Don\'t forget to complete your insurance application"',
  'subject:\n        "[DO NOT REPLY] Your insurance application is ready to be completed"'
);
// Try alternate form with smart quote
content = content.replace(
  /subject:\s*\n\s*"\[DO NOT REPLY\] Don.t forget to complete your insurance application"/,
  'subject:\n        "[DO NOT REPLY] Your insurance application is ready to be completed"'
);
content = content.replace(
  'subject: "[DO NOT REPLY] Your insurance application has expired"',
  'subject: "[DO NOT REPLY] Your insurance application progress"'
);

// 7. Update subject lines in send functions
content = content.replace(
  'subject: "[DO NOT REPLY] Your application is saved!"',
  'subject: "[DO NOT REPLY] Your insurance application is being saved"'
);
content = content.replace(
  'subject: "[DO NOT REPLY] Your insurance application has been submitted"',
  'subject: "[DO NOT REPLY] Thank you! We\\u2019ve received your insurance request"'
);
content = content.replace(
  `subject:
      "[DO NOT REPLY] Confirm your email to continue your saved insurance application"`,
  `subject:
      "[DO NOT REPLY] Your requested link to continue your application"`
);

fs.writeFileSync('src/utils/mockEmail.ts', content);
console.log('All email templates updated successfully');
