<template>
    <div class="task-manager">
        <h1>Task Manager</h1>
        <ul class="task-messages">
            <li v-for="(message, index) in taskMessages"
                :key="index">
                {{ message }}
            </li>
        </ul>
        <ul class="settings-messages">
            <li v-for="(message, index) in settingsMessages"
                :key="index">
                {{ message }}
            </li>
        </ul>
        <div class="task-input">
            <input v-model="newTaskTitle" placeholder="Enter task title"/>
            <select v-model="newTaskCategory">
                <option v-for="category in categories"
                        :key="category"
                        :value="category">
                    {{ category }}
                </option>
            </select>
            <button @click="addTask">Add Task</button>
        </div>
        <button class="manage-categories" @click="toggleCategoryManagement">
            {{ showCategoryManagement ? 'Hide Categories' : 'Manage Categories' }}
        </button>
        <div v-if="showCategoryManagement" class="category-management">
            <div class="category-input">
                <input v-model="newCategory" placeholder="Enter new category"/>
                <button @click="addCategory">Add Category</button>
            </div>
            <ul class="category-list">
                <li v-for="category in categories" :key="category">
                    <div class="category-text">
                        <input v-model="editCategoryValue"
                               placeholder="Edit category"
                               v-if="editingCategory === category"
                        />
                        <span v-else>{{ category }}</span>
                    </div>
                    <div class="category-buttons">
                        <button @click="startEditCategory(category)" v-if="editingCategory !== category">Edit</button>
                        <button @click="saveEditCategory(category)" v-if="editingCategory === category">Save</button>
                        <button @click="deleteCategory(category)">Delete</button>
                    </div>
                </li>
            </ul>
        </div>
        <div class="controls">
            <label>
                Filter by category:
                <select v-model="filterCategory">
                    <option value="All">All</option>
                    <option v-for="category in categories"
                            :key="category"
                            :value="category">
                        {{ category }}
                    </option>
                </select>
            </label>
            <label>
                Auto-save:
                <input type="checkbox" v-model="userSettings.autoSave"/>
            </label>
        </div>
        <p class="stats">{{ taskStats }}</p>
        <ul class="task-list">
            <li v-for="task in filteredTasks"
                :key="task.id"
                :class="{ completed: task.completed }"
            >
                <div class="task-content">
                    <input type="checkbox"
                           :checked="task.completed"
                           @change="toggleTaskCompletion(task.id)"
                    />
                    <span>{{ task.title }} ({{ task.category }})</span>
                </div>
                <button @click="removeTask(task.id)">Delete</button>
            </li>
        </ul>
        <div v-if="showModal" class="modal">
            <div class="modal-content">
                <p>Tasks and categories found in localStorage. Load them or start fresh?</p>
                <button @click="loadFromStorage">Load Data</button>
                <button @click="startFresh">Start Fresh</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, watchEffect} from 'vue'

interface Task {
    id: number
    title: string
    completed: boolean
    category: string
}

const TASKS_STORAGE_KEY = 'watchers.tasks'
const CATEGORIES_STORAGE_KEY = 'watchers.categories'
const DEFAULT_TASKS = [
    {id: 1, title: 'Learn Vue', completed: false, category: 'Work'},
    {id: 2, title: 'Buy groceries', completed: true, category: 'Personal'}
]

const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY)
const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY)
const showModal = ref(storedTasks !== null || storedCategories !== null)
const tasks = ref<Task[]>(storedTasks ? [] : DEFAULT_TASKS)

const categories = ref<string[]>(storedCategories ? JSON.parse(storedCategories) : ['Work', 'Personal'])
const newTaskTitle = ref<string>('')
const newTaskCategory = ref<string>('Work')
const filterCategory = ref<string>('All')
const userSettings = ref<{
    autoSave: boolean
    notificationCount: number
}>({
    autoSave: true,
    notificationCount: 0
})
const newCategory = ref<string>('')
const editingCategory = ref<string | null>(null)
const editCategoryValue = ref<string>('')
const showCategoryManagement = ref<boolean>(false)

const filteredTasks = computed<Task[]>(() => {
    if (filterCategory.value === 'All') {
        return tasks.value
    }

    return tasks.value.filter(task => task.category === filterCategory.value)
})

const taskMessages = ref<string[]>([])
const settingsMessages = ref<string[]>([])

function addMessage(messages: string[], message: string) {
    if (messages.length >= 5) {
        messages.shift()
    }

    messages.push(message)
    setTimeout(() => {
        messages.shift()
    }, 5000)
}

watch(tasks, (newTasks) => {
    if (userSettings.value.autoSave) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks))
        addMessage(settingsMessages.value, `Task list saved to localStorage at ${new Date().toLocaleTimeString()}`)
    }
}, {deep: true})

watch(categories, (newCategories) => {
    if (userSettings.value.autoSave) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(newCategories))
        addMessage(settingsMessages.value, `Categories saved to localStorage at ${new Date().toLocaleTimeString()}`)
    }
}, {deep: true})

watch(tasks, (newTasks, oldTasks) => {
    if (newTasks.length < oldTasks.length) {
        addMessage(taskMessages.value, 'Task deleted')
    }
}, {deep: true})

watch([newTaskTitle, newTaskCategory], ([newTitle, newCategory], [oldTitle, oldCategory]) => {
    if (newTitle && newCategory !== oldCategory) {
        addMessage(taskMessages.value, `New task category changed to ${newCategory}`)
    }
})

watch(() => userSettings.value.autoSave, (autoSave) => {
    addMessage(settingsMessages.value, autoSave ? 'Auto-save enabled' : 'Auto-save disabled')
}, {immediate: true})

const taskStats = ref<string>('')
watchEffect(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.completed).length

    taskStats.value = `Total tasks: ${total}, Completed: ${completed}, Active: ${total - completed}`
})

watch(userSettings, (newSettings) => {
    if (newSettings.notificationCount > 0) {
        addMessage(settingsMessages.value, `Pending notifications: ${newSettings.notificationCount}`)
    }
}, {deep: true})

function addTask() {
    if (!newTaskTitle.value.trim()) {
        return
    }

    const newTask = {
        id: tasks.value.length + 1,
        title: newTaskTitle.value.trim(),
        completed: false,
        category: newTaskCategory.value
    }

    taskMessages.value = []
    tasks.value.push(newTask)
    addMessage(taskMessages.value, `Added task: ${newTask.title}`)
    newTaskTitle.value = ''
    userSettings.value.notificationCount++
}

function toggleTaskCompletion(taskId: number) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
        task.completed = !task.completed
        userSettings.value.notificationCount++
    }
}

function removeTask(taskId: number) {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
}

function addCategory() {
    if (newCategory.value.trim() && !categories.value.includes(newCategory.value.trim())) {
        categories.value.push(newCategory.value.trim())
        addMessage(taskMessages.value, `Added category: ${newCategory.value.trim()}`)
        newCategory.value = ''
    }
}

function startEditCategory(category: string) {
    editingCategory.value = category
    editCategoryValue.value = category
}

function saveEditCategory(oldCategory: string) {
    if (!editCategoryValue.value.trim() || categories.value.includes(editCategoryValue.value.trim())) {
        return
    }

    const index = categories.value.indexOf(oldCategory)
    categories.value[index] = editCategoryValue.value.trim()
    tasks.value = tasks.value.map(task =>
        task.category === oldCategory ? {...task, category: editCategoryValue.value.trim()} : task
    )
    addMessage(taskMessages.value, `Edited category: ${oldCategory} to ${editCategoryValue.value.trim()}`)
    editingCategory.value = null
    editCategoryValue.value = ''
}

function deleteCategory(category: string) {
    if (categories.value.length <= 1) {
        addMessage(taskMessages.value, 'Cannot delete the last category')

        return
    }

    categories.value = categories.value.filter(c => c !== category)
    tasks.value = tasks.value.map(task =>
        task.category === category ? {...task, category: categories.value[0]} : task
    )
    addMessage(taskMessages.value, `Deleted category: ${category}`)
    if (filterCategory.value === category) {
        filterCategory.value = 'All'
    }

    if (newTaskCategory.value === category) {
        newTaskCategory.value = categories.value[0]
    }
}

function toggleCategoryManagement() {
    showCategoryManagement.value = !showCategoryManagement.value
    if (!showCategoryManagement.value) {
        newCategory.value = ''
        editingCategory.value = null
        editCategoryValue.value = ''
    }
}

function loadFromStorage() {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY)
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY)

    if (storedTasks) {
        tasks.value = JSON.parse(storedTasks)
    }

    if (storedCategories) {
        categories.value = JSON.parse(storedCategories)
    }

    showModal.value = false
}

function startFresh() {
    localStorage.removeItem(TASKS_STORAGE_KEY)
    localStorage.removeItem(CATEGORIES_STORAGE_KEY)
    tasks.value = DEFAULT_TASKS
    categories.value = ['Work', 'Personal']
    showModal.value = false
}
</script>

<style scoped>
.task-manager {
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

h1 {
    text-align: center;
    color: #2c3e50;
}

.task-messages,
.settings-messages {
    list-style: none;
    padding: 0;
    text-align: center;
    min-height: 20px;
}

.task-messages li {
    color: #e74c3c;
}

.settings-messages {
    margin-bottom: 10px;
}

.settings-messages li {
    color: #3498db;
}

.task-input {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.manage-categories {
    display: block;
    width: 100%;
    padding: 8px;
    font-size: 16px;
    background-color: #2ecc71;
    color: white;
    border: none;
    cursor: pointer;
    margin-bottom: 20px;
}

.manage-categories:hover {
    background-color: #27ae60;
}

.category-management {
    margin-bottom: 20px;
}

.category-input {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.task-input input,
.task-input select,
.task-input button,
.category-input input,
.category-input button {
    padding: 8px;
    font-size: 16px;
}

.task-input button,
.category-input button {
    background-color: #3498db;
    color: white;
    border: none;
    cursor: pointer;
}

.task-input button:hover,
.category-input button:hover {
    background-color: #2980b9;
}

.category-list {
    list-style: none;
    padding: 0;
    margin-bottom: 20px;
}

.category-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
}

.category-buttons {
    display: flex;
    gap: 10px;
}

.category-text {
    display: flex;
    align-items: center;
}

.category-list button {
    padding: 5px 10px;
    cursor: pointer;
}

.category-list button:first-child {
    background-color: #f1c40f;
    color: black;
}

.category-list button:first-child:hover {
    background-color: #e1b12c;
}

.category-list button:last-child {
    background-color: #e74c3c;
    color: white;
}

.category-list button:last-child:hover {
    background-color: #c0392b;
}

.controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.stats {
    font-weight: bold;
    color: #2c3e50;
}

.task-list {
    list-style: none;
    padding: 0;
}

.task-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #ecf0f1;
}

.task-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.task-list li.completed span {
    text-decoration: line-through;
    color: #7f8c8d;
}

.task-list button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    width: 80px;
    text-align: center;
}

.task-list button:hover {
    background-color: #c0392b;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
}

.modal-content button {
    margin: 10px;
    padding: 8px 16px;
    cursor: pointer;
}
</style>
