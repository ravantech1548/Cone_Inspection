import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('taxonomy');
  const [taxonomy, setTaxonomy] = useState([]);
  const [models, setModels] = useState([]);
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [taxonomyData, modelsData, promptsData] = await Promise.all([
        api.get('/admin/taxonomy'),
        api.get('/admin/models'),
        api.get('/admin/prompts')
      ]);
      
      setTaxonomy(taxonomyData);
      setModels(modelsData);
      setPrompts(promptsData);
    } catch (error) {
      alert(`Failed to load admin data: ${error.message}`);
    }
  };

  const activateModel = async (modelId) => {
    try {
      await api.patch(`/admin/models/${modelId}/activate`);
      loadData();
    } catch (error) {
      alert(`Failed to activate model: ${error.message}`);
    }
  };

  return (
    <div className="admin-page">
      <h1>Administration</h1>

      <div className="tabs">
        <button
          className={activeTab === 'taxonomy' ? 'active' : ''}
          onClick={() => setActiveTab('taxonomy')}
        >
          Color Taxonomy
        </button>
        <button
          className={activeTab === 'models' ? 'active' : ''}
          onClick={() => setActiveTab('models')}
        >
          Models
        </button>
        <button
          className={activeTab === 'prompts' ? 'active' : ''}
          onClick={() => setActiveTab('prompts')}
        >
          Prompts
        </button>
      </div>

      {activeTab === 'taxonomy' && (
        <div className="taxonomy-section">
          <h2>Color Taxonomy</h2>
          <table>
            <thead>
              <tr>
                <th>Color Name</th>
                <th>LAB Range</th>
                <th>Hex Examples</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {taxonomy.map(color => (
                <tr key={color.id}>
                  <td>{color.color_name}</td>
                  <td>
                    L: {color.lab_range?.L?.join('-')}<br />
                    A: {color.lab_range?.A?.join('-')}<br />
                    B: {color.lab_range?.B?.join('-')}
                  </td>
                  <td>
                    {color.hex_examples?.map((hex, i) => (
                      <span key={i} style={{ backgroundColor: hex, padding: '2px 8px', marginRight: '4px' }}>
                        {hex}
                      </span>
                    ))}
                  </td>
                  <td>{color.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="models-section">
          <h2>Model Registry</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Checksum</th>
                <th>Active</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id}>
                  <td>{model.name}</td>
                  <td>{model.version}</td>
                  <td>{model.checksum.substring(0, 12)}...</td>
                  <td>{model.is_active ? '✓' : ''}</td>
                  <td>{new Date(model.created_at).toLocaleDateString()}</td>
                  <td>
                    {!model.is_active && (
                      <button onClick={() => activateModel(model.id)}>Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="prompts-section">
          <h2>Prompt Registry</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Schema Version</th>
                <th>Active</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map(prompt => (
                <tr key={prompt.id}>
                  <td>{prompt.name}</td>
                  <td>{prompt.version}</td>
                  <td>{prompt.schema_version}</td>
                  <td>{prompt.is_active ? '✓' : ''}</td>
                  <td>{new Date(prompt.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
