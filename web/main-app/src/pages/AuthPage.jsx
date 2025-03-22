import Auth from '../components/Auth';

const AuthPage = ({isSignIn=true}) => {
    return (
        <Auth isSignIn={isSignIn}/>
    );
};

export default AuthPage;
