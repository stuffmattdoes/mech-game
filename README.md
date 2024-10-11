# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

<img width="974" alt="pixel-01" src="https://github.com/user-attachments/assets/e15ccbcf-4403-4767-b090-011c7bc06668">
<img width="973" alt="pixel-02" src="https://github.com/user-attachments/assets/b46415d5-af5a-4e46-b261-0adbd7fe3e59">
<img width="975" alt="pixel-03" src="https://github.com/user-attachments/assets/038b6370-9ebb-4453-837a-d3562a5546e9">
<img width="975" alt="pixel-04" src="https://github.com/user-attachments/assets/ad30b679-d35a-4bf2-88d2-00a9f6304c79">
<img width="974" alt="pixel-05" src="https://github.com/user-attachments/assets/7b106c3a-d35e-43da-9d06-809f272b8023">
<img width="974" alt="pixel-06" src="https://github.com/user-attachments/assets/11c55736-fa05-4d57-bcde-e92a9119e907">
<img width="972" alt="pixel-07" src="https://github.com/user-attachments/assets/fb39539f-311d-4efb-8f98-e3cb7d43f1f2">


https://github.com/user-attachments/assets/a8423967-fe9b-4cb1-81f4-802a8199e5f2

