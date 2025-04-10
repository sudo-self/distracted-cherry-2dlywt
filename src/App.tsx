import React, { useState, useEffect, useCallback } from 'react';

// Define common script snippets
const commonSnippets = {
  sh: [
    { id: 'shebang', name: 'Shebang (#!/bin/bash)', code: '#!/bin/bash\n' },
    { id: 'header_comment', name: 'Header Comment Block', code: '#-------------------------------------\n# Script Name: \n# Description: \n# Author: \n# Date: \n#-------------------------------------\n\n' },
    { id: 'simple_func', name: 'Simple Function', code: 'my_function() {\n  echo "Hello from function!"\n}\n\n# Call the function\n# my_function\n' },
    { id: 'read_input', name: 'Read User Input', code: 'read -p "Enter value: " user_input\necho "You entered: $user_input"\n' },
  ],
  ps1: [
    { id: 'header_comment', name: 'Header Comment Block', code: '<#\n.SYNOPSIS\n   \n.DESCRIPTION\n   \n.NOTES\n   Author: \n   Date: \n#>\n\n' },
    { id: 'param_block', name: 'Parameter Block', code: 'param (\n    [Parameter(Mandatory=$true)]\n    [string]$InputParameter\n)\n\nWrite-Host "Input was: $InputParameter"\n' },
    { id: 'simple_func', name: 'Simple Function', code: 'function My-Function {\n    param()\n    Write-Host "Hello from function!"\n}\n\n# Call the function\n# My-Function\n' },
    { id: 'read_input', name: 'Read User Input', code: '$userInput = Read-Host -Prompt "Enter value"\nWrite-Host "You entered: $userInput"\n' },
  ],
};

// Helper function to generate menu code
const generateMenuCode = (scriptType: 'sh' | 'ps1', items: Array<{ title: string; action: string }>): string => {
  if (items.length === 0) return '';

  if (scriptType === 'sh') {
    let menuCode = 'show_menu() {\n    echo "--------------------"\n    echo "      M A I N   M E N U"\n    echo "--------------------"\n';
    items.forEach((item, index) => {
      menuCode += `    echo "${index + 1}. ${item.title}"\n`;
    });
    menuCode += '    echo "0. Exit"\n}\n\n';
    menuCode += 'read_option(){\n    local choice\n    read -p "Enter choice [ 1 - ' + items.length + ' ] " choice\n    case $choice in\n';
    items.forEach((item, index) => {
      menuCode += `        ${index + 1}) ${item.action} ;;\n`;
    });
    menuCode += '        0) echo "Exiting." ; exit 0 ;;\n';
    menuCode += '        *) echo -e "Error: Invalid option..." && sleep 2\n';
    menuCode += '    esac\n}\n\n';
    menuCode += 'while true\ndo\n    show_menu\n    read_option\ndone\n';
    return menuCode;
  } else { // ps1
    let menuCode = 'function Show-Menu {\n    Write-Host "--------------------"\n    Write-Host "      M A I N   M E N U"\n    Write-Host "--------------------"\n';
    items.forEach((item, index) => {
      menuCode += `    Write-Host "${index + 1}. ${item.title}"\n`;
    });
    menuCode += '    Write-Host "0. Exit"\n}\n\n';
    menuCode += 'do {\n    Show-Menu\n    $choice = Read-Host -Prompt "Enter choice [ 1 - ' + items.length + ' ]"\n    switch ($choice) {\n';
    items.forEach((item, index) => {
      menuCode += `        "${index + 1}" { ${item.action} }\n`;
    });
    menuCode += '        "0" { Write-Host "Exiting."; exit }\n';
    menuCode += '        default { Write-Host "Error: Invalid option..." -ForegroundColor Red; Start-Sleep -Seconds 2 }\n';
    menuCode += '    }\n} while ($choice -ne "0")\n';
    return menuCode;
  }
};

export default function ScriptBuilder() {
  const [scriptType, setScriptType] = useState<'sh' | 'ps1'>('sh');
  const [includeAsciiArt, setIncludeAsciiArt] = useState<boolean>(false);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [includeMenu, setIncludeMenu] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<Array<{ title: string; action: string }>>([]);
  const [newItemTitle, setNewItemTitle] = useState<string>('');
  const [newItemAction, setNewItemAction] = useState<string>('');
  const [mainScript, setMainScript] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');

  const handleAddMenuItem = () => {
    if (newItemTitle.trim() && newItemAction.trim()) {
      setMenuItems([...menuItems, { title: newItemTitle, action: newItemAction }]);
      setNewItemTitle('');
      setNewItemAction('');
    }
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const insertSnippet = (code: string) => {
    // For simplicity, append the snippet to the main script area
    setMainScript(prev => prev + '\n' + code);
  };

  const generateScript = useCallback(() => {
    let content = '';
    const commentChar = scriptType === 'sh' ? '#' : '#'; // PowerShell also uses # for single line comments

    // 1. Shebang (only for sh)
    if (scriptType === 'sh') {
      const shebangSnippet = commonSnippets.sh.find(s => s.id === 'shebang');
      if (shebangSnippet) {
          content += shebangSnippet.code + '\n';
      }
    }

    // 2. ASCII Art
    if (includeAsciiArt && asciiArt.trim()) {
      content += `${commentChar} --- ASCII Art ---\n`;
      content += asciiArt.split('\n').map(line => `${commentChar} ${line}`).join('\n');
      content += `\n${commentChar} -----------------\n\n`;
    }

    // 3. Main Script Content (Place before menu if menu is included)
    if (mainScript.trim() && !includeMenu) {
        content += `${commentChar} --- Main Script Logic ---\n`;
        content += mainScript;
        content += `\n${commentChar} -------------------------\n\n`;
    } else if (mainScript.trim() && includeMenu) {
        // If menu is included, place main script content where it might be called from functions/actions
        content += `${commentChar} --- Functions & Main Logic (called by menu) ---\n`;
        content += mainScript;
        content += `\n${commentChar} --------------------------------------------\n\n`;
    }


    // 4. Menu
    if (includeMenu && menuItems.length > 0) {
      content += `${commentChar} --- Menu System ---\n`;
      content += generateMenuCode(scriptType, menuItems);
      content += `\n${commentChar} -------------------\n\n`;
    }

    setPreviewContent(content);
  }, [scriptType, includeAsciiArt, asciiArt, includeMenu, menuItems, mainScript]);

  useEffect(() => {
    generateScript();
  }, [generateScript]);

  const handleExport = () => {
    const filename = scriptType === 'sh' ? 'script.sh' : 'script.ps1';
    const blob = new Blob([previewContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentSnippets = commonSnippets[scriptType];

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen text-gray-800 p-4 space-y-4 md:space-y-0 md:space-x-4">
      {/* Configuration Panel */}
      <div className="md:w-1/3 bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
            {/* Placeholder Icon */}
            <div className="bg-blue-100 border-2 border-dashed border-blue-300 rounded-xl w-12 h-12 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
             <h1 className="text-xl font-semibold text-gray-700">Script Builder</h1>
        </div>


        {/* Script Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Script Type</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="scriptType"
                value="sh"
                checked={scriptType === 'sh'}
                onChange={() => setScriptType('sh')}
              />
              <span className="ml-2">Bash (.sh)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-purple-600"
                name="scriptType"
                value="ps1"
                checked={scriptType === 'ps1'}
                onChange={() => setScriptType('ps1')}
              />
              <span className="ml-2">PowerShell (.ps1)</span>
            </label>
          </div>
        </div>

        {/* ASCII Art Section */}
        <div className="space-y-2 border-t pt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox rounded text-blue-600"
              checked={includeAsciiArt}
              onChange={(e) => setIncludeAsciiArt(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Include ASCII Art</span>
          </label>
          {includeAsciiArt && (
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-24 font-mono text-sm"
              placeholder={`Enter your ASCII art here...\nIt will be commented out automatically.`}
              value={asciiArt}
              onChange={(e) => setAsciiArt(e.target.value)}
            />
          )}
        </div>

        {/* Menu Builder Section */}
        <div className="space-y-2 border-t pt-4">
           <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox rounded text-blue-600"
              checked={includeMenu}
              onChange={(e) => setIncludeMenu(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Build Interactive Menu</span>
          </label>
          {includeMenu && (
            <div className="space-y-3 pl-2">
                <div className="space-y-1">
                    <input
                        type="text"
                        placeholder="Menu Item Title (e.g., Run Task A)"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder={scriptType === 'sh' ? 'Action Command (e.g., do_task_a)' : 'Action Command (e.g., Invoke-TaskA)'}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={newItemAction}
                        onChange={(e) => setNewItemAction(e.target.value)}
                    />
                     <button
                        onClick={handleAddMenuItem}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Add Menu Item
                    </button>
                </div>
                 {menuItems.length > 0 && (
                    <ul className="space-y-1 text-sm max-h-32 overflow-y-auto border p-2 rounded-md">
                        {menuItems.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-100 p-1 rounded">
                            <span>{index + 1}. {item.title} ({item.action})</span>
                             <button
                                onClick={() => handleRemoveMenuItem(index)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                                Remove
                            </button>
                        </li>
                        ))}
                    </ul>
                )}
            </div>
          )}
        </div>

         {/* Common Snippets Section */}
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700">Insert Common Snippets</h3>
          <div className="grid grid-cols-2 gap-2">
            {currentSnippets.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => insertSnippet(snippet.code)}
                className="p-2 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 text-left"
                title={snippet.code.substring(0, 50) + '...'}
              >
                {snippet.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Editor and Preview Panel */}
      <div className="md:w-2/3 flex flex-col space-y-4">
        {/* Main Script Editor */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex-grow flex flex-col">
          <label htmlFor="mainScript" className="block text-sm font-medium text-gray-700 mb-2">Main Script Area</label>
          <textarea
            id="mainScript"
            className="flex-grow w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
            placeholder={`Write your ${scriptType === 'sh' ? 'Bash' : 'PowerShell'} script here...\nFunctions or logic called by the menu should be defined here.`}
            value={mainScript}
            onChange={(e) => setMainScript(e.target.value)}
          />
        </div>

        {/* Preview Panel */}
        <div className="bg-gray-900 p-4 rounded-lg shadow-md border border-gray-700 flex-grow flex flex-col h-64 md:h-auto">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-green-300">Preview</label>
                 <button
                    onClick={handleExport}
                    className="px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                >
                    Export {scriptType === 'sh' ? '.sh' : '.ps1'}
                </button>
            </div>

          <pre className="flex-grow w-full p-2 border border-gray-700 rounded-md bg-gray-800 text-green-400 font-mono text-xs overflow-auto">
            <code>
              {previewContent || '// Preview will appear here...'}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}