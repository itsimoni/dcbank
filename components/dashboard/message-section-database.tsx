"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTranslations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Mail,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  Trash2,
  ChevronRight,
  Search,
  X,
  Inbox,
  Bell,
  FileText,
  Shield,
  Archive,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface MessageSectionProps {
  userProfile: UserProfile;
}

type FolderType = "inbox" | "alerts" | "statements" | "security" | "archived";

interface Message {
  id: string;
  user_id: string;
  title: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  folder: FolderType;
}

type FilterType = "all" | "alert" | "info" | "success" | "warning";
type StatusFilter = "all" | "unread";
type SortOrder = "newest" | "oldest";

export default function MessageSection({ userProfile }: MessageSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const [selectedFolder, setSelectedFolder] = useState<FolderType>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const t = useMemo(() => getTranslations(language), [language]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchMessages();
    }
  }, [userProfile?.id]);

  const fetchMessages = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // ✅ Gmail-style archive: move out of Inbox into Archived
  const archiveMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ folder: "archived" })
        .eq("id", messageId);

      if (error) throw error;

      fetchMessages();

      if (selectedMessage?.id === messageId) {
        setIsDrawerOpen(false);
        setSelectedMessage(null);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // ✅ Gmail-style "Move to Inbox" when viewing Archived
  const unarchiveMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ folder: "inbox" })
        .eq("id", messageId);

      if (error) throw error;

      fetchMessages();

      if (selectedMessage?.id === messageId) {
        setIsDrawerOpen(false);
        setSelectedMessage(null);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
      if (selectedMessage?.id === messageId) {
        setIsDrawerOpen(false);
        setSelectedMessage(null);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const bulkMarkAsRead = async () => {
    try {
      const messageIds = Array.from(selectedMessages);
      await Promise.all(
        messageIds.map((id) =>
          supabase.from("user_messages").update({ is_read: true }).eq("id", id)
        )
      );
      fetchMessages();
      setSelectedMessages(new Set());
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const bulkArchive = async () => {
    try {
      const messageIds = Array.from(selectedMessages);
      await Promise.all(
        messageIds.map((id) =>
          supabase.from("user_messages").update({ folder: "archived" }).eq("id", id)
        )
      );
      fetchMessages();
      setSelectedMessages(new Set());
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const bulkMoveToInbox = async () => {
    try {
      const messageIds = Array.from(selectedMessages);
      await Promise.all(
        messageIds.map((id) =>
          supabase.from("user_messages").update({ folder: "inbox" }).eq("id", id)
        )
      );
      fetchMessages();
      setSelectedMessages(new Set());
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const bulkDelete = async () => {
    try {
      const messageIds = Array.from(selectedMessages);
      await Promise.all(
        messageIds.map((id) =>
          supabase.from("user_messages").delete().eq("id", id)
        )
      );
      fetchMessages();
      setSelectedMessages(new Set());
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);
  };

  const openMessageDrawer = (message: Message) => {
    setSelectedMessage(message);
    setIsDrawerOpen(true);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMessageBadge = (type: string) => {
    const badges = {
      alert: { text: t.securityAlertBadge, color: "bg-red-50 text-red-700 border-red-200" },
      info: { text: t.accountInfoBadge, color: "bg-blue-50 text-blue-700 border-blue-200" },
      success: { text: t.transactionUpdateBadge, color: "bg-green-50 text-green-700 border-green-200" },
      warning: { text: t.systemMessageBadge, color: "bg-amber-50 text-amber-700 border-amber-200" },
      default: { text: t.systemMessageBadge, color: "bg-gray-50 text-gray-700 border-gray-200" },
    };
    return badges[type as keyof typeof badges] || badges.default;
  };

  const getFolderIcon = (folder: FolderType) => {
    switch (folder) {
      case "inbox":
        return <Inbox className="w-4 h-4" />;
      case "alerts":
        return <Bell className="w-4 h-4" />;
      case "statements":
        return <FileText className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      case "archived":
        return <Archive className="w-4 h-4" />;
    }
  };

  const getFolderName = (folder: FolderType) => {
    switch (folder) {
      case "inbox":
        return t.inboxFolder;
      case "alerts":
        return t.alertsFolder;
      case "statements":
        return t.statementsFolder;
      case "security":
        return t.securityFolder;
      case "archived":
        return t.archivedFolder;
    }
  };

  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // ✅ Gmail hierarchy:
    // Inbox = everything not archived (shows ALL non-archived regardless of other folders)
    // Archived = only archived
    // Other folders = only that folder, excluding archived
    if (selectedFolder === "inbox") {
      filtered = filtered.filter((msg) => msg.folder !== "archived");
    } else if (selectedFolder === "archived") {
      filtered = filtered.filter((msg) => msg.folder === "archived");
    } else {
      filtered = filtered.filter((msg) => msg.folder === selectedFolder);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((msg) => msg.message_type === typeFilter);
    }

    if (statusFilter === "unread") {
      filtered = filtered.filter((msg) => !msg.is_read);
    }

    if (sortOrder === "oldest") {
      filtered = [...filtered].reverse();
    }

    return filtered;
  }, [messages, selectedFolder, searchQuery, typeFilter, statusFilter, sortOrder]);

  const unreadCount = messages.filter((m) => !m.is_read && m.folder !== "archived").length;

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c]"></div>
          <span className="ml-2">{t.loadingMessagesText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col lg:flex-row bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <div className="w-full lg:w-48 xl:w-60 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 lg:p-4 border-b border-gray-200">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{t.messagesTitle}</h2>
            <p className="text-xs text-gray-600 mt-1 truncate">
              {unreadCount} {t.unreadMessages}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 hidden lg:block">
            <div className="space-y-1">
              {(["inbox", "alerts", "statements", "security", "archived"] as FolderType[]).map(
                (folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full flex items-center gap-2 xl:gap-3 px-2 xl:px-3 py-2 text-xs xl:text-sm transition-colors ${
                      selectedFolder === folder
                        ? "bg-red-50 text-red-700 border-l-4 border-[#b91c1c]"
                        : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    {getFolderIcon(folder)}
                    <span className="font-medium truncate">{getFolderName(folder)}</span>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex lg:hidden overflow-x-auto p-2 gap-2">
            {(["inbox", "alerts", "statements", "security", "archived"] as FolderType[]).map(
              (folder) => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-colors whitespace-nowrap ${
                    selectedFolder === folder
                      ? "bg-red-50 text-red-700 border-b-2 border-[#b91c1c]"
                      : "text-gray-700 hover:bg-gray-50 border-b-2 border-transparent"
                  }`}
                >
                  {getFolderIcon(folder)}
                  <span className="font-medium">{getFolderName(folder)}</span>
                </button>
              )
            )}
          </div>

          <div className="p-3 lg:p-4 border-t border-gray-200 hidden lg:block">
            <div className="space-y-1">
              <button className="w-full flex items-center text-xs text-gray-600 hover:text-gray-900 py-1.5 truncate">
                <span className="truncate">{t.allMessages}</span>
              </button>
              <button className="w-full flex items-center text-xs text-gray-600 hover:text-gray-900 py-1.5 truncate">
                <span className="truncate">{t.unreadMessages}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white border-b border-gray-200 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t.searchMessages}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMessages}
                className="border-gray-300 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={(value: FilterType) => setTypeFilter(value)}>
                <SelectTrigger className="w-24 sm:w-28 lg:w-32 border-gray-300 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">{t.allMessages}</SelectItem>
                  <SelectItem value="alert" className="text-xs sm:text-sm">{t.securityAlertBadge}</SelectItem>
                  <SelectItem value="info" className="text-xs sm:text-sm">{t.accountInfoBadge}</SelectItem>
                  <SelectItem value="success" className="text-xs sm:text-sm">{t.transactionUpdateBadge}</SelectItem>
                  <SelectItem value="warning" className="text-xs sm:text-sm">{t.systemMessageBadge}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-24 sm:w-28 lg:w-32 border-gray-300 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">{t.allMessages}</SelectItem>
                  <SelectItem value="unread" className="text-xs sm:text-sm">{t.unreadMessages}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                <SelectTrigger className="w-24 sm:w-28 lg:w-32 border-gray-300 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs sm:text-sm">{t.sortNewest}</SelectItem>
                  <SelectItem value="oldest" className="text-xs sm:text-sm">{t.sortOldest}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1 hidden sm:block" />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkMarkAsRead}
                  disabled={selectedMessages.size === 0}
                  className="border-gray-300 text-xs flex-1 sm:flex-none"
                >
                  <span className="truncate">{t.markReadBulk}</span>
                </Button>

                {selectedFolder !== "archived" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkArchive}
                    disabled={selectedMessages.size === 0}
                    className="border-gray-300 text-xs flex-1 sm:flex-none"
                  >
                    <Archive className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline truncate">{t.archivedFolder}</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkMoveToInbox}
                    disabled={selectedMessages.size === 0}
                    className="border-gray-300 text-xs flex-1 sm:flex-none"
                  >
                    <Inbox className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline truncate">{t.inboxFolder}</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={bulkDelete}
                  disabled={selectedMessages.size === 0}
                  className="border-gray-300 text-red-600 hover:text-red-700 text-xs flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4 sm:mr-1" />
                  <span className="hidden lg:inline truncate">{t.deleteSelected}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 flex items-center justify-center mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t.allCaughtUp}</h3>
                <p className="text-xs sm:text-sm text-gray-600 text-center max-w-md px-4">
                  {t.emptyStateHelp}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((message) => {
                  const badge = getMessageBadge(message.message_type);
                  const isSelected = selectedMessages.has(message.id);

                  return (
                    <div
                      key={message.id}
                      className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                        !message.is_read ? "border-[#b91c1c] bg-red-50/30" : "border-transparent"
                      } ${isSelected ? "bg-blue-50" : ""}`}
                      onClick={() => openMessageDrawer(message)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleMessageSelection(message.id);
                        }}
                        className="w-4 h-4 text-[#b91c1c] border-gray-300 focus:ring-[#b91c1c] shrink-0"
                      />

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {!message.is_read && (
                          <div className="w-2 h-2 bg-[#b91c1c]" />
                        )}
                        {getMessageIcon(message.message_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                          <h3
                            className={`text-xs sm:text-sm truncate ${
                              !message.is_read ? "font-semibold text-gray-900" : "font-normal text-gray-700"
                            }`}
                          >
                            {message.title}
                          </h3>
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 border whitespace-nowrap ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate line-clamp-1">
                          {message.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-[10px] sm:text-xs text-gray-500 tabular-nums whitespace-nowrap">
                          {new Date(message.created_at).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border-t border-gray-200 p-2 sm:p-4">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
              <span className="truncate">
                {filteredMessages.length} {t.messagesTitle.toLowerCase()}
              </span>
              {selectedMessages.size > 0 && (
                <span className="text-[#b91c1c] truncate ml-2">
                  {selectedMessages.size} {t.selectMessages.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-64 xl:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 lg:p-4 hidden md:block">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 truncate">{t.helpAndSupport}</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors">
              <span className="truncate">{t.contactSupport}</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
            </button>
            <button className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors">
              <span className="truncate">{t.reportSuspicious}</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
            </button>
            <button className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors">
              <span className="truncate">{t.viewDocuments}</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {isDrawerOpen && selectedMessage && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[90%] md:w-[600px] lg:w-[700px] max-w-[700px] bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">{t.messageDetails}</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="shrink-0">{getMessageIcon(selectedMessage.message_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 break-words">
                      {selectedMessage.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                      <span
                        className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border whitespace-nowrap ${
                          getMessageBadge(selectedMessage.message_type).color
                        }`}
                      >
                        {getMessageBadge(selectedMessage.message_type).text}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {new Date(selectedMessage.created_at).toLocaleDateString()} {t.atTimeText}{" "}
                        {new Date(selectedMessage.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {!selectedMessage.is_read && (
                  <Button
                    variant="outline"
                    onClick={() => markAsRead(selectedMessage.id)}
                    className="flex-1 border-gray-300 text-xs sm:text-sm"
                  >
                    <span className="truncate">{t.markAsReadButton}</span>
                  </Button>
                )}

                {selectedMessage.folder !== "archived" ? (
                  <Button
                    variant="outline"
                    onClick={() => archiveMessage(selectedMessage.id)}
                    className="flex-1 border-gray-300 text-xs sm:text-sm"
                  >
                    <Archive className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
                    <span className="truncate">{t.archivedFolder}</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => unarchiveMessage(selectedMessage.id)}
                    className="flex-1 border-gray-300 text-xs sm:text-sm"
                  >
                    <Inbox className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
                    <span className="truncate">{t.inboxFolder}</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0" />
                  <span className="truncate">{t.deleteSelected}</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
