import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  signInToGoogle,
  getStoredToken,
  signOut,
  uploadBackup,
  listBackups,
  downloadBackup,
  isSignedIn,
} from "@/src/utils/googleDrive";
import {
  createBackupFile,
  restoreFromFile,
  importBackupData,
  exportAllData,
} from "@/src/utils/backup";

interface BackupEntry {
  id: string;
  name: string;
  size: string;
  createdTime: string;
}

export default function BackupScreen() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLabel, setActionLabel] = useState("");
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const signed = await isSignedIn();
    setConnected(signed);
    if (signed) {
      loadBackupList();
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setActionLabel("Connecting to Google Drive...");
    try {
      const token = await signInToGoogle();
      if (token) {
        setConnected(true);
        loadBackupList();
      } else {
        Alert.alert(
          "Couldn't connect",
          "Please try again. We only access files created by this app."
        );
      }
    } catch {
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setLoading(false);
      setActionLabel("");
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Disconnect Google Drive?",
      "Your backups will remain on Drive but you won't be able to create new ones until you reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await signOut();
            setConnected(false);
            setBackups([]);
          },
        },
      ]
    );
  };

  const loadBackupList = async () => {
    setLoadingBackups(true);
    try {
      const token = await getStoredToken();
      if (!token) return;
      const list = await listBackups(token);
      setBackups(list);
    } catch {
      // Silent fail — user can retry
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleBackup = async () => {
    if (isWeb) {
      Alert.alert("Web preview", "Backup requires a native build.");
      return;
    }

    setLoading(true);
    setActionLabel("Creating encrypted backup...");
    try {
      const filePath = await createBackupFile();
      if (!filePath) throw new Error("Failed to create backup file");

      setActionLabel("Uploading to Google Drive...");
      const token = await getStoredToken();
      if (!token) throw new Error("Not authenticated");

      const result = await uploadBackup(token, filePath);

      Alert.alert(
        "Backup complete",
        `Your data has been encrypted and saved to Google Drive.\n\nFile: ${result.fileName}`
      );
      loadBackupList();
    } catch (e: any) {
      Alert.alert("Backup failed", e.message ?? "Please try again.");
    } finally {
      setLoading(false);
      setActionLabel("");
    }
  };

  const handleRestore = async (backup: BackupEntry) => {
    Alert.alert(
      "Restore from backup?",
      `This will add contacts and interactions from "${backup.name}". Your existing data won't be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            setLoading(true);
            setActionLabel("Downloading backup...");
            try {
              const token = await getStoredToken();
              if (!token) throw new Error("Not authenticated");

              const localPath = await downloadBackup(token, backup.id);

              setActionLabel("Decrypting and restoring...");
              const data = await restoreFromFile(localPath);
              const result = importBackupData(data);

              Alert.alert(
                "Restore complete",
                `Restored ${result.contactCount} contacts, ${result.interactionCount} interactions, and ${result.occasionCount} occasions.`
              );
            } catch (e: any) {
              Alert.alert(
                "Restore failed",
                "The backup may have been created with a different encryption key. Make sure you're restoring on the same device that created the backup."
              );
            } finally {
              setLoading(false);
              setActionLabel("");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (sizeStr: string) => {
    const bytes = parseInt(sizeStr, 10);
    if (isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Backup & Restore</Text>
        <Text style={styles.subtitle}>
          Your backup is encrypted on your device before uploading. Only this
          device can decrypt it.
        </Text>
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingText}>{actionLabel}</Text>
        </View>
      )}

      {/* Connection status */}
      <View style={styles.section}>
        <View style={styles.connectionRow}>
          <View>
            <Text style={styles.sectionTitle}>Google Drive</Text>
            <Text style={styles.connectionStatus}>
              {connected ? "✅ Connected" : "Not connected"}
            </Text>
          </View>
          {connected ? (
            <Pressable style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.connectBtn}
              onPress={handleConnect}
              disabled={loading}
            >
              <Text style={styles.connectText}>Connect</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.privacyNote}>
          🔒 We only access files created by this app. We can't see your
          other Drive files.
        </Text>
      </View>

      {/* Backup button */}
      {connected && (
        <View style={styles.section}>
          <Pressable
            style={[styles.backupBtn, loading && styles.btnDisabled]}
            onPress={handleBackup}
            disabled={loading}
          >
            <Text style={styles.backupBtnEmoji}>☁️</Text>
            <View>
              <Text style={styles.backupBtnText}>Back up now</Text>
              <Text style={styles.backupBtnHint}>
                Encrypts and uploads your data
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Backup list */}
      {connected && (
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Your backups</Text>
            {loadingBackups && (
              <ActivityIndicator size="small" color="#0a7ea4" />
            )}
          </View>

          {backups.length === 0 && !loadingBackups ? (
            <Text style={styles.emptyText}>
              No backups yet. Tap "Back up now" to create your first one.
            </Text>
          ) : (
            <FlatList
              data={backups}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.backupRow}
                  onPress={() => handleRestore(item)}
                >
                  <View style={styles.backupInfo}>
                    <Text style={styles.backupName}>
                      📄 {formatDate(item.createdTime)}
                    </Text>
                    <Text style={styles.backupSize}>
                      {formatSize(item.size)}
                    </Text>
                  </View>
                  <Text style={styles.restoreLabel}>Restore</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          • Your data is encrypted on your device before uploading{"\n"}
          • The encryption key stays on this device only{"\n"}
          • Backups can only be decrypted on the device that created them{"\n"}
          • We use the "drive.file" scope — we can only see files this app
          created
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backArrow: {
    fontSize: 16,
    color: "#0a7ea4",
    fontWeight: "600",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  connectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  connectionStatus: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  connectBtn: {
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  disconnectBtn: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disconnectText: {
    color: "#999",
    fontWeight: "600",
    fontSize: 14,
  },
  privacyNote: {
    fontSize: 12,
    color: "#AAA",
    lineHeight: 17,
  },
  backupBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FAFE",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D4EEF5",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  backupBtnEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  backupBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  backupBtnHint: {
    fontSize: 12,
    color: "#888",
    marginTop: 1,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#AAA",
    lineHeight: 20,
  },
  backupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  backupSize: {
    fontSize: 12,
    color: "#BBB",
    marginTop: 2,
  },
  restoreLabel: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "600",
  },
  loadingOverlay: {
    backgroundColor: "rgba(250,250,250,0.95)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#AAA",
    lineHeight: 20,
  },
});
