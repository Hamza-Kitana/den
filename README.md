# SmileCare — Dental Clinic Manager

Frontend dental clinic management system with appointments, patients, interactive dental charts, Arabic/English, and light/dark mode. Data is stored in the browser (`localStorage`).

## Development

```sh
npm i
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run lint`.

## Demo accounts

| Role      | Username    | Password    | Access                                                 |
| --------- | ----------- | ----------- | ------------------------------------------------------ |
| Admin     | `admin`     | `admin123`  | Full access + staff management + demo reset            |
| Doctor    | `doctor`    | `doctor123` | Patients, dental chart, treatments, appointment status |
| Secretary | `secretary` | `sec123`    | Patients basics + appointments scheduling              |

## Features

- Role-based permissions
- Daily appointments with conflict detection
- Patient files with FDI tooth chart and notes
- Treatments CRUD (doctor/admin)
- Arabic / English with RTL
- Light / Dark mode
- Demo data reset (admin sidebar)
