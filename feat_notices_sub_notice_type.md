## Adding `notice_sub_type` to notices table

A migration has been added to include the `notice_sub_type` column in the `notices` table. The `create` API now supports this new field and performs validation.

**Migration:**  
Run the following SQL to update your notices schema:

```sql
ALTER TABLE notices ADD COLUMN notice_sub_type VARCHAR(255) NULL;
```

---

## API Changes

### 1. `/api/create` (POST)

#### Description

Supports creation of notices with an additional, validated `notice_sub_type` field. If the given `notice_type` requires a sub-type, the request must include a valid `notice_sub_type`. Error handling is included for missing or invalid sub-types.

#### Example: Valid Request Payload

```json
{
  "id": "1702472618475",
  "title": "Test with sub type",
  "notice_type": "job",
  "notice_sub_type": "regularteaching",
  "openDate": 1702472618000,
  "closeDate": 1702472618000,
  "department": "AR",
  "attachments": [
    {
      "name": "test.doc",
      "url": "https://docs.cloud.testman.pdf"
    }
  ],
  "isDept": 0,
  "important": 0,
  "isVisible": 1,
  "email": "admin@institute.ac.in"
}
```

#### Example: Successful API Response

```json
{
  "affectedRows": 1,
  "insertId": "1702472618475",
  "warningStatus": 0
}
```

---

#### Example: Invalid Request Payload (Missing Required `notice_sub_type`)

```json
{
  "id": "1702472618476",
  "title": "Test missing sub type",
  "notice_type": "job",
  "openDate": 1702472618000,
  "closeDate": 1702472618000,
  "department": "AR",
  "attachments": [
    {
      "name": "test.doc",
      "url": "https://docs.cloud.testman.pdf"
    }
  ],
  "isDept": 0,
  "important": 0,
  "isVisible": 1,
  "email": "admin@institute.ac.in"
}
```

#### Example: Error API Response

```json
{
  "message": "Invalid or missing notice_sub_type for notice_type: job"
}
```

---

### 2. `/api/update` (PUT)

#### Description

Supports updating notices with the `notice_sub_type` field. Updates are performed at the notice level with full authorization checks. The API validates that if the given `notice_type` requires a sub-type, a valid `notice_sub_type` must be included.

#### Example: Valid Request Payload

```json
{
  "data": {
    "id": 1775663250583,
    "title": "Regular Teaching Faculty Position - Computer Science Department",
    "email": "mps@nitp.ac.in",
    "openDate": 1712534400000,
    "closeDate": 1715212800000,
    "notice_type": "job",
    "notice_sub_type": "regularteaching",
    "category": "FACULTY",
    "attachments": [
      {
        "name": "job_description.pdf",
        "url": "https://docs.cloud.google.com/faculty-job-posting-2024.pdf"
      },
    ],
    "important": 1,
    "department": "AR",
    "isDept": 0,
    "isVisible": 1
  },
  "type": "notice"
}
```

#### Example: Successful API Response

```json
{
  "fieldCount": 0,
  "affectedRows": 1,
  "insertId": 0,
  "info": "Rows matched: 1  Changed: 1  Warnings: 0",
  "serverStatus": 2,
  "warningStatus": 0,
  "changedRows": 1
}
```

---

#### Example: Invalid Request Payload (Missing Required `notice_sub_type`)

```json
{
  "data": {
    "id": 1775663250583,
    "title": "Updated Notice Missing Sub Type",
    "notice_type": "job",
    "openDate": 1775606400000,
    "closeDate": 1775606400000,
    "department": "AR",
    "isDept": 0
  },
  "type": "notice"
}
```

#### Example: Error API Response

```json
{
  "message": "Invalid or missing notice_sub_type for notice_type: job"
}
```

---

#### Authorization Notes

- **SUPER_ADMIN**: Can update any notice
- **ACADEMIC_ADMIN**: Can only update notices with `notice_type` = `'academics'`
- **DEPT_ADMIN**: Can only update notices with `notice_type` = `'department'` matching their department

The update automatically sets `updatedAt` to the current timestamp.

---

Just ensure your request payload includes a valid `notice_sub_type` string whenever it is required by the `notice_type` you are submitting or updating.  
The examples above show both success and error responses for reference.
