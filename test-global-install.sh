#!/bin/bash

# 🚀 PowerBackup Global Installation Test Script

echo "🧪 Testing PowerBackup Global Installation..."

# Test 1: Check if powerbackup command exists
echo "📋 Test 1: Checking if powerbackup command is available..."
if command -v powerbackup &> /dev/null; then
    echo "✅ powerbackup command found"
else
    echo "❌ powerbackup command not found"
    echo "💡 Try running: npm install -g powerbackup"
    exit 1
fi

# Test 2: Test help command
echo "📋 Test 2: Testing help command..."
if powerbackup --help &> /dev/null; then
    echo "✅ Help command works"
else
    echo "❌ Help command failed"
    exit 1
fi

# Test 3: Test init command (without actually running it)
echo "📋 Test 3: Testing init command structure..."
if powerbackup init --help &> /dev/null; then
    echo "✅ Init command structure works"
else
    echo "❌ Init command structure failed"
    exit 1
fi

# Test 4: Test list-dbs command
echo "📋 Test 4: Testing list-dbs command..."
if powerbackup list-dbs &> /dev/null; then
    echo "✅ List-dbs command works"
else
    echo "❌ List-dbs command failed"
    exit 1
fi

# Test 5: Test version
echo "📋 Test 5: Testing version command..."
if powerbackup --version | grep -q '2.2.0'; then
    echo "✅ Version command works and version is 2.2.0"
else
    echo "❌ Version command failed or version mismatch"
    exit 1
fi

echo "🎉 All tests passed! PowerBackup is ready for global use."
echo ""
echo "💡 Next steps:"
echo "   powerbackup init          # Initialize configuration"
echo "   powerbackup add-db        # Add your first database"
echo "   powerbackup create-now <db> # Create your first backup"

