const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

async function getInstanceInfo(instanceId) {
    try {
        const command = new DescribeInstancesCommand({
            InstanceIds: [instanceId],
        });
        
        const response = await ec2Client.send(command);
        return response.Reservations[0]?.Instances[0];
    } catch (error) {
        console.error('Error getting instance info:', error);
        throw error;
    }
}

async function checkInstanceHealth(instanceId) {
    try {
        const instance = await getInstanceInfo(instanceId);
        return {
            status: instance.State.Name,
            healthCheck: instance.HealthStatus,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error checking instance health:', error);
        throw error;
    }
}

module.exports = {
    getInstanceInfo,
    checkInstanceHealth
};