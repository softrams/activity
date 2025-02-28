import { getInput, info } from "@actions/core";
import { getOctokit } from "@actions/github";

interface Input {
  token: string;
  organization: string;
}

const getInputs = (): Input => {
  const result = {} as Input;
  result.token = getInput("github-token");
  result.organization = getInput("organization");
  console.log('result', result);
  if (!result.token || result.token === "") {
    throw new Error("github-token is required");
  }
  return result;
}

export const run = async (): Promise<void> => {
  const input = getInputs();
  const octokit = getOctokit(input.token);
  
  info(`Getting members of ${input.organization}`);
  const usersResponse = await octokit.paginate(octokit.rest.orgs.listMembers, {
    org: input.organization,
  });
  
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const formattedSince = since.toISOString().slice(0, 10);

  type userActivity = {
    commits?: unknown,
    _user: typeof usersResponse[0];
  };
  const users: Record<string, userActivity> = usersResponse.reduce((acc, user) => {
    acc[user.login] = {
      _user: user
    };
    return acc;
  }, {} as Record<string, userActivity>);

  for (const [login, activity] of Object.entries(users)) {
    const commits = await octokit.rest.search.commits({
      q: `author:${login} org:${input.organization} committer-date:<${formattedSince}`,
    });
    activity.commits = commits;
    
    await octokit.rest.search.issuesAndPullRequests({
      q: `author:${login} org:${input.organization} created:<${formattedSince}`,
    });
    

    await octokit.rest 
  }
  console.log(users);
};

run();
