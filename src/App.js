import React from 'react';
import './App.css';

import TemplateForm from './components/TemplateForm';

function App() {
  return (
    <div className="App">
      <div className="container">
        <div className="row mt-4 d-flex justify-content-center" >
          <div className="col-md-10">
            <TemplateForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
