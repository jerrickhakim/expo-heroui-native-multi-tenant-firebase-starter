import { useHasCapability } from "@/stores/tenant";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Card, SkeletonGroup, useThemeColor } from "heroui-native";
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useTasks, type Task } from "./_layout";

// Status configuration with colors and icons
const STATUS_CONFIG = {
  todo: {
    label: "To Do",
    color: "bg-muted/20",
    textColor: "text-muted",
    icon: "ellipse-outline" as const,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-accent/20",
    textColor: "text-accent",
    icon: "play-circle-outline" as const,
  },
  completed: {
    label: "Completed",
    color: "bg-success/20",
    textColor: "text-success",
    icon: "checkmark-circle-outline" as const,
  },
  archived: {
    label: "Archived",
    color: "bg-warning/20",
    textColor: "text-warning",
    icon: "archive-outline" as const,
  },
} as const;

function TaskSkeleton() {
  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-start gap-3">
        <SkeletonGroup.Item className="h-6 w-6 rounded-full">
          <View />
        </SkeletonGroup.Item>
        <View className="flex-1 gap-2">
          <SkeletonGroup.Item className="h-5 w-3/4 rounded-md">
            <View />
          </SkeletonGroup.Item>
          <SkeletonGroup.Item className="h-4 w-full rounded-md">
            <View />
          </SkeletonGroup.Item>
          <View className="flex-row items-center gap-2 mt-1">
            <SkeletonGroup.Item className="h-5 w-20 rounded-full">
              <View />
            </SkeletonGroup.Item>
            <SkeletonGroup.Item className="h-4 w-24 rounded-md">
              <View />
            </SkeletonGroup.Item>
          </View>
        </View>
      </View>
    </Card>
  );
}

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

function TaskCard({ task, onPress }: TaskCardProps) {
  const mutedColor = useThemeColor("muted");
  const statusConfig = STATUS_CONFIG[task.status];
  const accentColor = useThemeColor("accent");

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3 p-4">
        <View className="flex-row items-start gap-3">
          {/* Status icon */}
          <View className={`h-6 w-6 rounded-full ${statusConfig.color} items-center justify-center mt-0.5`}>
            <Ionicons
              name={statusConfig.icon}
              size={14}
              color={task.status === "completed" ? "#22c55e" : task.status === "in_progress" ? accentColor : mutedColor}
            />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text
              className={`font-semibold text-foreground ${task.status === "completed" ? "line-through opacity-60" : ""}`}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {task.description ? (
              <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                {task.description}
              </Text>
            ) : null}

            <View className="flex-row items-center gap-2 mt-2">
              {/* Status badge */}
              <View className={`px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                <Text className={`text-xs font-medium ${statusConfig.textColor}`}>{statusConfig.label}</Text>
              </View>

              {/* Created date */}
              {task.createdAt && (
                <Text className="text-xs text-muted">
                  <Ionicons name="time-outline" size={10} color={mutedColor} /> {formatDate(task.createdAt)}
                </Text>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={20} color={mutedColor} className="mt-0.5" />
        </View>
      </Card>
    </Pressable>
  );
}

export default function TasksScreen() {
  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();
  const hasCapability = useHasCapability(["tasks.create"]);
  const canCreateTask = useHasCapability(["tasks.create"]);
  const { tasks } = useTasks();

  const [refreshing, setRefreshing] = useState(false);
  const mutedColor = useThemeColor("muted");

  // Since tasks are realtime via onSnapshot, we just simulate a refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const handleTaskPress = useCallback(
    (taskId: string) => {
      router.push(`/${tenant}/${tenantId}/tasks/${taskId}`);
    },
    [tenant, tenantId]
  );

  const renderTask = useCallback(
    ({ item }: { item: Task }) => <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />,
    [handleTaskPress]
  );

  const renderEmpty = useCallback(() => {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <View className="h-20 w-20 rounded-full bg-accent/10 items-center justify-center mb-4">
          <Ionicons name="checkbox-outline" size={40} color={mutedColor} />
        </View>
        <Text className="text-foreground text-lg font-semibold">No Tasks Yet</Text>
        <Text className="text-muted text-center mt-2 px-8">Create your first task to start organizing your work.</Text>
        {canCreateTask && (
          <Pressable
            onPress={() => router.push(`/${tenant}/${tenantId}/tasks/new`)}
            className="mt-6 px-6 py-3 bg-accent rounded-xl flex-row items-center gap-2"
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text className="text-white font-semibold">Create Task</Text>
          </Pressable>
        )}
      </View>
    );
  }, [mutedColor, canCreateTask, tenant, tenantId]);

  // Check if still loading (tasks array is empty but might be loading)
  const isLoading = tasks.length === 0 && !refreshing;

  return (
    <View className="flex-1 bg-background">
      <SkeletonGroup isLoading={false} className="flex-1">
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </SkeletonGroup>
    </View>
  );
}
