import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { runAllTests } from '../utils/testAgents';
import { testItemComponent } from '../components/ItemComponent';
import { testBudgetWarning } from '../components/BudgetWarning';

const TestScreen = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [componentTestResults, setComponentTestResults] = useState({});

  // Run all agent tests
  const handleRunAgentTests = async () => {
    setLoading(true);
    try {
      const results = await runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Error running agent tests:', error);
      setTestResults({
        passed: [],
        failed: ['Testing framework encountered an error']
      });
    } finally {
      setLoading(false);
    }
  };

  // Run component tests
  const handleRunComponentTests = async () => {
    setLoading(true);
    try {
      const results = {
        ItemComponent: await testItemComponent(),
        BudgetWarning: await testBudgetWarning(),
      };
      setComponentTestResults(results);
    } catch (error) {
      console.error('Error running component tests:', error);
      setComponentTestResults({
        error: 'Testing framework encountered an error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render test results
  const renderTestResults = () => {
    if (!testResults) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Agent Test Results</Text>
        <Text style={styles.resultsSubtitle}>
          Passed: {testResults.passed.length}/{testResults.passed.length + testResults.failed.length}
        </Text>

        {testResults.passed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ Passed Tests:</Text>
            {testResults.passed.map(test => (
              <Text key={test} style={styles.passedTest}>{test}</Text>
            ))}
          </>
        )}

        {testResults.failed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>❌ Failed Tests:</Text>
            {testResults.failed.map(test => (
              <Text key={test} style={styles.failedTest}>{test}</Text>
            ))}
          </>
        )}
      </View>
    );
  };

  // Render component test results
  const renderComponentTestResults = () => {
    if (!componentTestResults || Object.keys(componentTestResults).length === 0) return null;

    if (componentTestResults.error) {
      return (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Component Test Results</Text>
          <Text style={styles.failedTest}>{componentTestResults.error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Component Test Results</Text>
        {Object.entries(componentTestResults).map(([component, result]) => (
          <View key={component} style={styles.componentTestResult}>
            <Text style={styles.componentName}>{component}:</Text>
            <Text style={styles.passedTest}>{result}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Screen</Text>
        <Text style={styles.subtitle}>Run tests for the Shop Buddy app</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.agentButton]}
            onPress={handleRunAgentTests}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Run Agent Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.componentButton]}
            onPress={handleRunComponentTests}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Run Component Tests</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Running tests...</Text>
          </View>
        )}

        {renderTestResults()}
        {renderComponentTestResults()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  agentButton: {
    backgroundColor: '#007AFF',
  },
  componentButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  passedTest: {
    color: '#28a745',
    marginLeft: 8,
    fontSize: 14,
  },
  failedTest: {
    color: '#dc3545',
    marginLeft: 8,
    fontSize: 14,
  },
  componentTestResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  componentName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TestScreen; 