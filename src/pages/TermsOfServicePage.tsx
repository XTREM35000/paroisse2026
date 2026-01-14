export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <title>Conditions d'Utilisation - Espace Paroissial</title>
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 sm:p-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Conditions d'Utilisation</h1>
        <p className="text-slate-600 mb-8">Dernière mise à jour : janvier 2026</p>

        {/* Introduction */}
        <section className="mb-8">
          <p className="text-slate-700 leading-relaxed">
            Bienvenue sur l'application <strong>Espace Paroissial</strong>. Ces Conditions d'Utilisation régissent votre accès et votre utilisation de l'application, y compris tous les contenus, fonctionnalités et services disponibles. En accédant ou en utilisant l'application, vous acceptez intégralement ces conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
          </p>
        </section>

        {/* 1. Définitions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Définitions</h2>
          <ul className="space-y-3 text-slate-700 ml-4">
            <li><strong>Application :</strong> L'application web Espace Paroissial accessible à <code className="bg-slate-100 px-2 py-1 rounded text-sm">https://paroisse-ten.vercel.app</code></li>
            <li><strong>Utilisateur :</strong> Toute personne accédant et utilisant l'application</li>
            <li><strong>Paroisse :</strong> L'organisme gestionnaire de l'application et propriétaire du contenu</li>
            <li><strong>Contenu :</strong> Tous les textes, images, vidéos, audios, documents et données disponibles sur l'application</li>
            <li><strong>Services :</strong> Toutes les fonctionnalités offertes par l'application, y compris les notifications, les événements, les donations, etc.</li>
          </ul>
        </section>

        {/* 2. Accès et inscription */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Accès à l'Application et Inscription</h2>
          <h3 className="text-lg font-bold text-slate-900 mb-3">2.1 Inscription</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            Pour accéder à certaines fonctionnalités de l'application, vous devrez créer un compte en fournissant :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-4">
            <li>Votre adresse email valide</li>
            <li>Un mot de passe sécurisé</li>
            <li>Votre nom complet</li>
            <li>Éventuellement, une photo de profil</li>
          </ul>
          <p className="text-slate-700 leading-relaxed">
            Vous êtes responsable de la confidentialité de vos identifiants de connexion. Vous acceptez de notifier immédiatement l'administrateur de l'application en cas de découverte d'accès non autorisé à votre compte.
          </p>

          <h3 className="text-lg font-bold text-slate-900 mb-3 mt-6">2.2 Authentification via des tiers</h3>
          <p className="text-slate-700 leading-relaxed">
            Vous pouvez également vous connecter via des fournisseurs d'authentification tiers (Facebook, Google, etc.). En utilisant cette option, vous acceptez que l'application accède à certaines informations de profil publiques et à votre adresse email.
          </p>
        </section>

        {/* 3. Utilisation acceptable */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Utilisation Acceptable</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            En utilisant l'application, vous acceptez de ne pas :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Violer les lois, les réglementations ou les droits d'autrui</li>
            <li>Utiliser l'application à des fins commerciales sans autorisation préalable</li>
            <li>Transmettre des contenus offensants, harcelants, obscènes ou discriminatoires</li>
            <li>Accéder à l'application de manière non autorisée ou contourner les mesures de sécurité</li>
            <li>Télécharger ou diffuser des malwares, virus ou logiciels malveillants</li>
            <li>Spammer, envoyer des messages en masse ou du contenu indésirable</li>
            <li>Utiliser l'application pour collecter des données sans autorisation</li>
            <li>Impersonifier une autre personne ou entité</li>
            <li>Créer plusieurs comptes pour contourner les restrictions ou abus</li>
          </ul>
        </section>

        {/* 4. Propriété intellectuelle */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Propriété Intellectuelle</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Tout le contenu disponible sur l'application (textes, images, vidéos, audios, codes, designs) est la propriété exclusive de la Paroisse ou de ses contributeurs autorisés. Vous ne pouvez pas :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-4">
            <li>Reproduire, modifier ou adapter le contenu sans autorisation écrite préalable</li>
            <li>Distribuer, vendre ou louer le contenu</li>
            <li>Utiliser le contenu pour créer des applications ou services concurrents</li>
          </ul>
          <p className="text-slate-700 leading-relaxed">
            Une utilisation personnelle et non commerciale du contenu est autorisée, sous réserve du respect des droits d'auteur.
          </p>
        </section>

        {/* 5. Limitation de responsabilité */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Limitation de Responsabilité</h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-slate-700 leading-relaxed mb-3">
              <strong>L'application est fournie "telle quelle"</strong> sans aucune garantie explicite ou implicite. La Paroisse ne garantit pas :
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>La disponibilité continue de l'application</li>
              <li>L'absence d'erreurs ou de bugs</li>
              <li>La sécurité absolue contre les accès non autorisés</li>
              <li>L'exactitude ou la complétude de tous les contenus</li>
            </ul>
          </div>
          <p className="text-slate-700 leading-relaxed">
            En aucun cas, la Paroisse ne sera responsable des dommages directs, indirects, accessoires, spéciaux ou consécutifs résultant de votre utilisation de l'application, même si elle a été informée de la possibilité de tels dommages.
          </p>
        </section>

        {/* 6. Contenus générés par les utilisateurs */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Contenus Générés par les Utilisateurs</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Si vous publiez, téléchargez ou partagez du contenu via l'application (commentaires, messages, photos, etc.) :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Vous confirmez que vous possédez ou avez les droits d'utiliser ce contenu</li>
            <li>Vous accordez à la Paroisse une licence non exclusive, gratuite et perpétuelle d'utiliser ce contenu</li>
            <li>Vous acceptez que la Paroisse puisse modérer, supprimer ou refuser de publier votre contenu</li>
            <li>Vous êtes entièrement responsable du contenu que vous publiez</li>
          </ul>
        </section>

        {/* 7. Suspension et résiliation */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Suspension et Résiliation</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            La Paroisse se réserve le droit de :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-4">
            <li>Suspendre ou résilier votre compte en cas de violation des présentes conditions</li>
            <li>Bloquer votre accès sans préavis en cas d'abus ou d'activité malveillante</li>
            <li>Supprimer tout contenu contraire aux conditions d'utilisation</li>
          </ul>
          <p className="text-slate-700 leading-relaxed">
            Vous pouvez résilier votre compte à tout moment en supprimant votre profil via les paramètres de l'application ou en nous contactant par email.
          </p>
        </section>

        {/* 8. Modifications de l'application */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Modifications de l'Application</h2>
          <p className="text-slate-700 leading-relaxed">
            La Paroisse se réserve le droit de modifier, mettre à jour ou cesser l'exploitation de l'application ou de certains services à tout moment, sans préavis. Aucune responsabilité n'est engagée en cas d'indisponibilité temporaire ou définitive de l'application.
          </p>
        </section>

        {/* 9. Liens externes */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Liens Externes</h2>
          <p className="text-slate-700 leading-relaxed">
            L'application peut contenir des liens vers des sites web externes. La Paroisse n'est pas responsable du contenu, de la disponibilité ou de la politique de confidentialité de ces sites externes. Consultez les conditions d'utilisation et les politiques de confidentialité des tiers avant d'utiliser leurs services.
          </p>
        </section>

        {/* 10. Conformité légale */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Conformité Légale</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Vous acceptez de respecter toutes les lois applicables dans votre juridiction :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Lois sur la protection des données et la confidentialité</li>
            <li>Lois sur la propriété intellectuelle</li>
            <li>Lois sur la fraude et la criminalité informatique</li>
            <li>Lois applicables à votre pays ou région</li>
          </ul>
        </section>

        {/* 11. Données personnelles */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Données Personnelles</h2>
          <p className="text-slate-700 leading-relaxed">
            Le traitement de vos données personnelles est régi par notre <strong>Politique de Confidentialité</strong>. En utilisant l'application, vous acceptez la collecte et l'utilisation de vos données conformément à cette politique. Pour plus d'informations, veuillez consulter notre <a href="/privacy-policy" className="text-blue-600 hover:underline">Politique de Confidentialité</a>.
          </p>
        </section>

        {/* 12. Notifications et communications */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Notifications et Communications</h2>
          <p className="text-slate-700 leading-relaxed">
            En créant un compte, vous acceptez de recevoir des communications de la Paroisse, notamment :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-4">
            <li>Notifications liées à votre compte</li>
            <li>Mises à jour importantes sur l'application</li>
            <li>Informations sur les événements et actualités de la paroisse</li>
            <li>Alertes de sécurité</li>
          </ul>
          <p className="text-slate-700 leading-relaxed">
            Vous pouvez gérer vos préférences de notification dans les paramètres de votre profil.
          </p>
        </section>

        {/* 13. Indemnisation */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Indemnisation</h2>
          <p className="text-slate-700 leading-relaxed">
            Vous acceptez d'indemniser et de dégager de toute responsabilité la Paroisse, ses administrateurs, ses employés et ses agents de toute réclamation, perte, dommage ou dépense (y compris les frais juridiques) découlant de :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4 mb-4">
            <li>Votre violation des présentes conditions</li>
            <li>Votre utilisation de l'application</li>
            <li>Votre contenu ou vos actions</li>
            <li>Toute violation des droits d'autrui</li>
          </ul>
        </section>

        {/* 14. Intégralité de l'accord */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Intégralité de l'Accord</h2>
          <p className="text-slate-700 leading-relaxed">
            Ces Conditions d'Utilisation, ainsi que notre Politique de Confidentialité et les instructions d'utilisation spécifiques, constituent l'intégralité de l'accord entre vous et la Paroisse concernant votre utilisation de l'application. Elles remplacent tous les accords antérieurs ou contemporains, écrits ou verbaux.
          </p>
        </section>

        {/* 15. Modifications des conditions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">15. Modifications des Conditions</h2>
          <p className="text-slate-700 leading-relaxed">
            La Paroisse se réserve le droit de modifier ces Conditions d'Utilisation à tout moment. Les modifications prendront effet dès leur publication sur l'application. Votre utilisation continue de l'application après la publication des modifications constitue votre acceptation des nouvelles conditions. Nous vous recommandons de consulter régulièrement cette page pour rester informé des mises à jour.
          </p>
        </section>

        {/* 16. Contact et support */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">16. Contact et Support</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Si vous avez des questions concernant ces Conditions d'Utilisation ou si vous souhaitez signaler une violation, veuillez nous contacter à :
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded p-4">
            <p className="text-slate-700"><strong>Email :</strong> basilediane71@gmail.com</p>
          </div>
        </section>

        {/* 17. Juridiction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">17. Juridiction et Loi Applicable</h2>
          <p className="text-slate-700 leading-relaxed">
            Ces Conditions d'Utilisation sont régies par les lois en vigueur en France. Tout litige ou réclamation découlant de votre utilisation de l'application sera soumis à la juridiction exclusive des tribunaux compétents de France. En utilisant l'application, vous acceptez cette juridiction et cette loi applicable.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            Ces Conditions d'Utilisation sont effectives à partir de janvier 2026 et peuvent être modifiées à tout moment. Pour toute question, veuillez nous contacter.
          </p>
        </footer>
      </div>
    </main>
  );
}
