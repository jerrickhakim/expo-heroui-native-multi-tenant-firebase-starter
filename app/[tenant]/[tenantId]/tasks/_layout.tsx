import { db } from "@/integrations/firebase.client";
import { Stack } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

import { useLocalSearchParams } from "expo-router";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import { z } from "zod";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed" | "archived";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "completed", "archived"]),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});

interface TasksContextType {
  tasks: Task[];
  taskSchema: typeof taskSchema;
  setTasks: (tasks: Task[]) => void;
  create: (task: Task) => Promise<Task>;
  update: (task: Task) => Promise<Task>;
  delete: (task: Task) => void;
  list: () => Task[];
  retrieve: (id: string) => Promise<Task>;
}

const TasksContext = createContext<TasksContextType>({
  tasks: [],
  taskSchema,
  setTasks: () => {},
  create: async () => ({ id: "", title: "", description: "", status: "todo", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }),
  update: async () => ({ id: "", title: "", description: "", status: "todo", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }),
  delete: () => {},
  list: () => [],
  retrieve: async () => ({ id: "", title: "", description: "", status: "todo", createdAt: Timestamp.now(), updatedAt: Timestamp.now() }),
});

const TasksProvider = ({ children }: PropsWithChildren) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();

  // Create
  const create = async (task: Task) => {
    const taskData = { ...task, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, `${tenant}/${tenantId}/tasks`), taskData);
    return { ...task, id: docRef.id } as Task;
  };

  // Update
  const update = async (task: Task) => {
    const taskData = { ...task, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, `${tenant}/${tenantId}/tasks`, task.id), taskData);
    return task;
  };

  // Delete
  const deleteTask = (task: Task) => {
    deleteDoc(doc(db, `${tenant}/${tenantId}/tasks`, task.id));
  };

  // List
  const list = () => {
    getDocs(collection(db, `${tenant}/${tenantId}/tasks`));
    return tasks;
  };

  // Retreive
  const retrieve = async (id: string) => {
    const task = await getDoc(doc(db, `${tenant}/${tenantId}/tasks`, id));
    return { ...task.data(), id: task.id } as Task;
  };

  const subscribe = () => {
    const tasksQuery = query(collection(db, `${tenant}/${tenantId}/tasks`), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Task[]);
    });
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = subscribe();
    return () => unsubscribe();
  }, []);

  return (
    <TasksContext.Provider value={{ tasks, taskSchema, setTasks, create, update, delete: deleteTask, list, retrieve }}>
      {children}
    </TasksContext.Provider>
  );
};

export default function TasksLayout() {
  return (
    <TasksProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="new"
          options={{
            presentation: "modal",
            title: "New Task",
          }}
        />
        <Stack.Screen
          name="[taskId]"
          options={{
            headerShown: false,
            presentation: "modal",
            title: "Task Details",
          }}
        />
      </Stack>
    </TasksProvider>
  );
}

export const useTasks = () => {
  return useContext(TasksContext);
};
