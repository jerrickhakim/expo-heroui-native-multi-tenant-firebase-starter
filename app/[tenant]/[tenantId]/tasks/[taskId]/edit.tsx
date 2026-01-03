import TaskForm, { TaskFormValues } from "@/components/tasks/TaskForm";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Task, useTasks } from "../_layout";

export default function EditTaskScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { retrieve, update } = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const fetchedTask = await retrieve(taskId);
        setTask(fetchedTask);
      } catch (error) {
        console.error("Failed to fetch task:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleUpdateTask = async (values: TaskFormValues) => {
    if (!task) return;

    await update({
      ...task,
      title: values.title,
      description: values.description,
      status: values.status,
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <TaskForm
      mode="edit"
      initialValues={{
        title: task.title,
        description: task.description || "",
        status: task.status,
      }}
      onSubmit={handleUpdateTask}
    />
  );
}
