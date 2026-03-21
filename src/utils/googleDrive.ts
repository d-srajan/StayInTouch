import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_IOS = "__YOUR_IOS_CLIENT_ID__"; // Replace with real client ID
const GOOGLE_CLIENT_ID_ANDROID = "__YOUR_ANDROID_CLIENT_ID__";
const TOKEN_STORE_KEY = "sit_google_drive_token";
const BACKUP_FOLDER_NAME = "StayInTouch Backups";

// Scopes: only access files created by this app
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

// ── Auth ──

function getClientId(): string {
  if (Platform.OS === "ios") return GOOGLE_CLIENT_ID_IOS;
  return GOOGLE_CLIENT_ID_ANDROID;
}

export async function signInToGoogle(): Promise<string | null> {
  if (Platform.OS === "web") {
    return "mock-access-token";
  }

  try {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: "stayintouch" });
    const request = new AuthSession.AuthRequest({
      clientId: getClientId(),
      scopes: SCOPES,
      redirectUri,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === "success" && result.authentication) {
      const token = result.authentication.accessToken;
      await SecureStore.setItemAsync(TOKEN_STORE_KEY, token);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    return await SecureStore.getItemAsync(TOKEN_STORE_KEY);
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.deleteItemAsync(TOKEN_STORE_KEY);
  } catch {}
}

export async function isSignedIn(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}

// ── Drive operations ──

async function getOrCreateFolder(accessToken: string): Promise<string> {
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    }
  );
  const createData = await createRes.json();
  return createData.id;
}

export async function uploadBackup(
  accessToken: string,
  localFileUri: string
): Promise<{ fileId: string; fileName: string }> {
  const folderId = await getOrCreateFolder(accessToken);

  // Read file content
  const file = new File(localFileUri);
  const content = await file.text();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${timestamp}.enc`;

  // Multipart upload
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const boundary = "sit_backup_boundary";
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/octet-stream",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message ?? "Upload failed");
  }

  return { fileId: data.id, fileName: data.name };
}

export async function listBackups(
  accessToken: string
): Promise<
  Array<{ id: string; name: string; size: string; createdTime: string }>
> {
  const folderId = await getOrCreateFolder(accessToken);

  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=createdTime desc&fields=files(id,name,size,createdTime)&pageSize=10`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  return data.files ?? [];
}

export async function downloadBackup(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  // Download content as text
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const content = await res.text();

  // Write to local file
  const localFile = new File(Paths.document, "restore-temp.enc");
  localFile.write(content);

  return localFile.uri;
}

export async function deleteBackup(
  accessToken: string,
  fileId: string
): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
