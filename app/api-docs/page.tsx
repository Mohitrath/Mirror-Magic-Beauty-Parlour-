import { apiSpec } from "@/lib/studio/api-spec";
import { BookOpen } from "lucide-react";
export const metadata = { title: "API documentation" };
export default function Docs() {
  return (
    <main id="main-content" className="sub-page site-width docs">
      <p className="eyebrow">
        <i /> DEVELOPER REFERENCE
      </p>
      <h1>
        Studio <em>API.</em>
      </h1>
      <p className="intro">
        The same REST API powers the booking app and the staff desk. It accepts
        JSON and returns appointment times in Asia/Kolkata.
      </p>
      <div className="doc-actions">
        <a
          className="button primary"
          href="/api/openapi.json"
          target="_blank"
          rel="noreferrer"
        >
          <BookOpen />
          OpenAPI specification
        </a>
        <a
          className="button outline"
          href="/downloads/mirror-magic-source.zip"
          download
        >
          Download source
        </a>
      </div>
      <h2>Make a booking</h2>
      <ol>
        <li>
          Get a service ID from <code>GET /api/services</code>.
        </li>
        <li>
          Request open times using{" "}
          <code>
            GET /api/availability?serviceId=signature-cut&amp;date=YYYY-MM-DD
          </code>
          .
        </li>
        <li>
          Submit the selected time and customer details to{" "}
          <code>POST /api/bookings</code>. Use one UUID v4 request key per
          booking and keep the returned reference.
        </li>
      </ol>
      <p>
        Call <code>GET /api/session</code> first and retain cookies when testing
        as a guest. Customers can find a visit on another device using its reference and original
        email.
      </p>
      <h2>Endpoints</h2>
      <div className="endpoint-list">
        {Object.entries(apiSpec.paths).flatMap(([path, methods]) =>
          Object.entries(methods).map(([method, def]) => (
            <div key={method + path}>
              <b>{method.toUpperCase()}</b>
              <code>/api{path}</code>
              <span>{def.summary}</span>
            </div>
          )),
        )}
      </div>
      <h2>Booking conflicts</h2>
      <p>
        A successful new reservation returns <code>201</code>. Repeating the
        same request returns <code>200</code>. If a time has been taken, the API
        returns <code>409</code> and the app asks the customer to choose again.
      </p>
    </main>
  );
}
