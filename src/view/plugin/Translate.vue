<template>
    <div class="col-md-12">
        <div class="mb-20">
            <h1>{{ meta.title }}</h1>
        </div>
        <div class="card mb-4 box-shadow">
            <p>
                <span v-t="'greeting'"></span>
            </p>
            <p>
                <span v-t="'farewell'"></span>
            </p>
        </div>
        <div class="card mb-4 box-shadow">
            <p>
                <button @click="showTranslatedQuestion">{{ $translate('show_question') }}</button>
            </p>
            <p>
                <input type="text" v-t-input="{ key: 'instruction' }"/>
            </p>
        </div>
        <div class="card mb-4 box-shadow">
            <p>
                <span>{{ $translate('statement') }}</span>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import {inject} from 'vue'
import useRouteMeta from '@/hook/useRouteMeta'

const meta = useRouteMeta();

const translate = inject<(key: string, params?: Record<string, string | number>) => string>('translate')

const $translate = (key: string, params?: Record<string, string | number>) => {
    return translate ? translate(key, params) : key
};

const vTInput = {
    mounted(el: HTMLInputElement, binding: { value: { key: string } }): void {
        el.placeholder = $translate(binding.value.key)
    },
};

const showTranslatedQuestion = (): void => {
    alert($translate('question'))
};
</script>
