// Test plugin for React component integration (task7)
export default {
  name: 'React Panel Test Plugin',
  version: '1.0.0',
  description: 'Test plugin to verify React component panel functionality',
  author: 'Love Note Team',

  onLoad(api) {
    console.log('React Panel Test Plugin loaded');

    // Add a button that creates a React panel
    api.addButton('Create React Panel', () => {
      // Simple React component as a function
      function TestPanel({ api }) {
        const [count, setCount] = React.useState(0);
        const [message, setMessage] = React.useState('');

        const handleIncrement = () => {
          setCount(count + 1);
          setMessage(`Count updated to ${count + 1}`);
        };

        const handleShowMessage = () => {
          api.showMessage(`Counter is at ${count}`, 'info');
        };

        return React.createElement(
          'div',
          { className: 'space-y-4' },
          React.createElement(
            'h4',
            {
              className: 'text-lg font-semibold text-gray-800',
            },
            'React Component Test'
          ),

          React.createElement(
            'div',
            { className: 'space-y-2' },
            React.createElement(
              'p',
              {
                className: 'text-gray-600',
              },
              `Current count: ${count}`
            ),

            React.createElement(
              'button',
              {
                className:
                  'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-2',
                onClick: handleIncrement,
              },
              'Increment'
            ),

            React.createElement(
              'button',
              {
                className:
                  'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors',
                onClick: handleShowMessage,
              },
              'Show Message'
            )
          ),

          message &&
            React.createElement(
              'p',
              {
                className: 'text-sm text-green-600 italic',
              },
              message
            )
        );
      }

      // Create panel with the React component
      api.addPanel('React Test Panel', TestPanel);
      api.showMessage('React panel created successfully!', 'success');
    });

    api.showMessage(
      'React Panel Test Plugin ready! Click the button to create a panel.',
      'info'
    );
  },
};
