import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, SkeletonGroup, useThemeColor } from "heroui-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTasks, type Task } from "../_layout";

// Status configuration with colors and icons
const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "bg-muted/20",
    textColor: "text-muted",
    icon: "ellipse-outline" as const,
    iconColor: "#6b7280",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-accent/20",
    textColor: "text-accent",
    icon: "play-circle-outline" as const,
    iconColor: "#3b82f6",
  },
  completed: {
    label: "Completed",
    color: "bg-success/20",
    textColor: "text-success",
    icon: "checkmark-circle-outline" as const,
    iconColor: "#22c55e",
  },
  archived: {
    label: "Archived",
    color: "bg-warning/20",
    textColor: "text-warning",
    icon: "archive-outline" as const,
    iconColor: "#f59e0b",
  },
} as const;

function DetailSkeleton() {
  return (
    <View className="flex-1 p-4 gap-4">
      <SkeletonGroup.Item className="h-8 w-3/4 rounded-md">
        <View />
      </SkeletonGroup.Item>
      <SkeletonGroup.Item className="h-6 w-24 rounded-full">
        <View />
      </SkeletonGroup.Item>
      <SkeletonGroup.Item className="h-24 w-full rounded-md">
        <View />
      </SkeletonGroup.Item>
      <SkeletonGroup.Item className="h-5 w-32 rounded-md">
        <View />
      </SkeletonGroup.Item>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { tenant, tenantId, taskId } = useLocalSearchParams<{
    tenant: string;
    tenantId: string;
    taskId: string;
  }>();
  const { retrieve, update, delete: deleteTask } = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    try {
      const fetchedTask = await retrieve(taskId);
      setTask(fetchedTask);
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      setLoading(false);
    }
  }, [taskId, retrieve]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (newStatus: Task["status"]) => {
    if (!task) return;
    try {
      const updatedTask = { ...task, status: newStatus };
      await update(updatedTask);
      setTask(updatedTask);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!task) return;
          try {
            deleteTask(task);
            router.back();
          } catch (error) {
            console.error("Failed to delete task:", error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <SkeletonGroup isLoading={true} className="flex-1">
          <DetailSkeleton />
        </SkeletonGroup>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color={mutedColor} />
        <Text className="text-foreground text-lg font-semibold mt-4">Task Not Found</Text>
        <Text className="text-muted text-center mt-2">This task may have been deleted or doesn't exist.</Text>
        <Button onPress={() => router.back()} className="mt-6">
          <Button.Label>Go Back</Button.Label>
        </Button>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      {/* Title */}
      <Text className="text-2xl font-bold text-foreground mb-4">{task.title}</Text>

      {/* Status Badge */}
      <View className="flex-row items-center gap-2 mb-6">
        <Ionicons name={statusConfig.icon} size={20} color={statusConfig.iconColor} />
        <View className={`px-3 py-1 rounded-full ${statusConfig.color}`}>
          <Text className={`text-sm font-medium ${statusConfig.textColor}`}>{statusConfig.label}</Text>
        </View>
      </View>

      {/* Description */}
      {task.description ? (
        <Card className="mb-4 p-4">
          <Text className="text-sm font-medium text-muted mb-2">Description</Text>
          <Text className="text-foreground">{task.description}</Text>
        </Card>
      ) : (
        <Card className="mb-4 p-4">
          <Text className="text-muted italic">No description provided</Text>
        </Card>
      )}

      {/* Metadata */}
      <Card className="mb-6 p-4">
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <Ionicons name="calendar-outline" size={18} color={mutedColor} />
            <View>
              <Text className="text-sm text-muted">Created</Text>
              <Text className="text-foreground">{formatDate(task.createdAt)}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Ionicons name="refresh-outline" size={18} color={mutedColor} />
            <View>
              <Text className="text-sm text-muted">Last Updated</Text>
              <Text className="text-foreground">{formatDate(task.updatedAt)}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Quick Status Actions */}
      <Text className="text-sm font-medium text-muted mb-3">Quick Actions</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {task.status !== "completed" && (
          <Pressable
            onPress={() => handleStatusChange("completed")}
            className="flex-row items-center gap-2 px-4 py-2 bg-success/20 rounded-full"
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
            <Text className="text-success font-medium">Mark Complete</Text>
          </Pressable>
        )}
        {task.status !== "in_progress" && task.status !== "completed" && (
          <Pressable
            onPress={() => handleStatusChange("in_progress")}
            className="flex-row items-center gap-2 px-4 py-2 bg-accent/20 rounded-full"
          >
            <Ionicons name="play-circle-outline" size={18} color={accentColor} />
            <Text className="text-accent font-medium">Start Progress</Text>
          </Pressable>
        )}
        {task.status === "completed" && (
          <Pressable onPress={() => handleStatusChange("todo")} className="flex-row items-center gap-2 px-4 py-2 bg-muted/20 rounded-full">
            <Ionicons name="refresh-outline" size={18} color={mutedColor} />
            <Text className="text-muted font-medium">Reopen Task</Text>
          </Pressable>
        )}
        {task.status !== "archived" && (
          <Pressable
            onPress={() => handleStatusChange("archived")}
            className="flex-row items-center gap-2 px-4 py-2 bg-warning/20 rounded-full"
          >
            <Ionicons name="archive-outline" size={18} color="#f59e0b" />
            <Text className="text-warning font-medium">Archive</Text>
          </Pressable>
        )}
      </View>

      {/* Action Buttons */}
      <View className="gap-3">
        <Button
          onPress={() => router.push(`/${tenant}/${tenantId}/tasks/${taskId}/edit`)}
          className="flex-row items-center justify-center gap-2"
        >
          <Ionicons name="pencil-outline" size={18} color={accentColor} />
          <Button.Label>Edit Task</Button.Label>
        </Button>

        <Pressable onPress={handleDelete} className="flex-row items-center justify-center gap-2 py-3">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text className="text-danger font-medium">Delete Task</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
