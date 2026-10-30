// synced from templates/_core — edit there, then run `node scripts/templates/sync-core.mjs`
/** Shared platform identity, independent of the anonymous SigV4 Amplify client.
 * A store never creates an account pool or a user scoped to its organization.
 * Session storage remains origin-local; no session token is put in a URL.
 */
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

type ViteEnv = Record<string, string | boolean | undefined>;
const build = (import.meta as unknown as { env?: ViteEnv }).env || {};
export interface CustomerConfig {
  apiUrl: string;
  portalUrl: string;
  userPoolId: string;
  clientId: string;
}
let configPromise: Promise<CustomerConfig> | null = null;
export function customerConfig(): Promise<CustomerConfig> {
  return (configPromise ??= fetch("/config.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((raw: { customer?: Partial<CustomerConfig> }) => ({
      apiUrl: String(
        raw?.customer?.apiUrl || build.VITE_CUSTOMER_API_URL || "",
      ).replace(/\/$/, ""),
      portalUrl: String(
        raw?.customer?.portalUrl || build.VITE_CUSTOMER_PORTAL_URL || "",
      ).replace(/\/$/, ""),
      userPoolId: String(
        raw?.customer?.userPoolId || build.VITE_AWS_COGNITO_USER_POOL_ID || "",
      ),
      clientId: String(
        raw?.customer?.clientId || build.VITE_AWS_COGNITO_CLIENT_ID || "",
      ),
    })));
}
function pool(config: CustomerConfig) {
  if (!config.userPoolId || !config.clientId)
    throw Error(
      "El acceso de clientes todavía no está configurado en esta tienda.",
    );
  return new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });
}
export async function customerSession(): Promise<CognitoUserSession | null> {
  const config = await customerConfig();
  if (!config.userPoolId || !config.clientId) return null;
  const user = pool(config).getCurrentUser();
  if (!user) return null;
  return new Promise((resolve) =>
    user.getSession((error: Error | null, session: CognitoUserSession | null) =>
      resolve(!error && session?.isValid() ? session : null),
    ),
  );
}
export async function customerLogin(email: string, password: string) {
  const config = await customerConfig();
  return new Promise<void>((resolve, reject) =>
    new CognitoUser({ Username: email, Pool: pool(config) }).authenticateUser(
      new AuthenticationDetails({ Username: email, Password: password }),
      {
        onSuccess: () => resolve(),
        onFailure: reject,
        newPasswordRequired: () =>
          reject(
            Error(
              "Actualizá tu contraseña desde la recuperación de cuenta Tsuru.",
            ),
          ),
      },
    ),
  );
}
export async function customerRegister(
  email: string,
  password: string,
  name: string,
  lastName: string,
) {
  const config = await customerConfig();
  return new Promise<void>((resolve, reject) =>
    pool(config).signUp(
      email,
      password,
      [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "given_name", Value: name.trim() }),
        new CognitoUserAttribute({
          Name: "family_name",
          Value: lastName.trim(),
        }),
      ],
      [],
      (error) => (error ? reject(error) : resolve()),
    ),
  );
}
export async function customerVerify(email: string, code: string) {
  const config = await customerConfig();
  return new Promise<void>((resolve, reject) =>
    new CognitoUser({
      Username: email,
      Pool: pool(config),
    }).confirmRegistration(code, true, (error) =>
      error ? reject(error) : resolve(),
    ),
  );
}
export async function customerForgot(email: string) {
  const config = await customerConfig();
  return new Promise<void>((resolve, reject) =>
    new CognitoUser({ Username: email, Pool: pool(config) }).forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
      inputVerificationCode: () => resolve(),
    }),
  );
}
export async function customerReset(
  email: string,
  code: string,
  password: string,
) {
  const config = await customerConfig();
  return new Promise<void>((resolve, reject) =>
    new CognitoUser({ Username: email, Pool: pool(config) }).confirmPassword(
      code,
      password,
      { onSuccess: () => resolve(), onFailure: reject },
    ),
  );
}
export async function customerLogout() {
  const config = await customerConfig();
  pool(config).getCurrentUser()?.signOut();
}
export async function customerApi<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  key?: string,
): Promise<T> {
  const config = await customerConfig(),
    session = await customerSession();
  if (!config.apiUrl)
    throw Error(
      "El acceso de clientes todavía no está configurado en esta tienda.",
    );
  if (!session) {
    window.dispatchEvent(new Event("tsuru-customer-session"));
    throw Object.assign(
      Error("Iniciá sesión con tu cuenta Tsuru para continuar."),
      { status: 401 },
    );
  }
  const url = new URL(config.apiUrl + path);
  if (
    url.protocol !== "https:" &&
    !(build.DEV === true && ["localhost", "127.0.0.1"].includes(url.hostname))
  )
    throw Error("Configuración de acceso no válida.");
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${session.getIdToken().getJwtToken()}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const error = Object.assign(
      new Error(
        response.status === 409
          ? "La información cambió. Revisá los datos antes de volver a enviar."
          : response.status === 401 || response.status === 403
            ? "Iniciá sesión con tu cuenta Tsuru para continuar."
            : response.status === 404
              ? "Este producto ya no está disponible para intercambio."
              : "No se pudo completar la solicitud. Intentá de nuevo.",
      ),
      { status: response.status },
    );
    throw error;
  }
  return response.json() as Promise<T>;
}
export function customerPortalHref(
  config: CustomerConfig,
  path: string,
  shop?: string,
): string | null {
  if (!config.portalUrl) return null;
  try {
    const url = new URL(config.portalUrl);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" &&
        !(
          build.DEV === true &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    )
      return null;
    url.pathname = path;
    url.search = "";
    url.hash = "";
    if (shop) url.searchParams.set("shop", shop);
    return url.href;
  } catch {
    return null;
  }
}

export async function customerResend(email: string) {
  const config = await customerConfig();
  return new Promise<void>((resolve, reject) =>
    new CognitoUser({
      Username: email,
      Pool: pool(config),
    }).resendConfirmationCode((error) => (error ? reject(error) : resolve())),
  );
}
