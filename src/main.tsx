import {createRoot} from 'react-dom/client';
import App from './app/App';
import './styles/editor.css';
import './styles/workflow.css';
createRoot(document.getElementById('root')!).render(<App/>);
